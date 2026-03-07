import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role, sequelize } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateUserSchema, UpdateUserSchema, BulkDeleteSchema } from '../validators/user.validator';
import { auditService } from '../services/audit.service';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, record_status } = req.query;
        let where: any = { org_id: req.user.org_id };

        let paranoid = true;
        if (record_status === 'inactive') {
            paranoid = false;
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        const users = await User.findAll({
            where,
            paranoid,
            include: [{ model: Role }],
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(users);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(ADMIN_ROLES), validate(CreateUserSchema), async (req: any, res, next) => {
    try {
        const { email, password, role_id, username, first_name, last_name, phone } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            res.status(400).json({ detail: 'Email already registered' });
            return;
        }

        const role = await Role.findOne({ where: { id: role_id, org_id: req.user.org_id } });
        if (!role) {
            res.status(400).json({ detail: 'Invalid role' });
            return;
        }

        const requestorRole = req.user.Role?.name?.toLowerCase() || req.user.role?.name?.toLowerCase();
        if (['org_admin', 'admin'].includes(requestorRole) && ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
            res.status(403).json({ detail: 'You cannot assign Super Admin or Org Admin roles' });
            return;
        }

        const newUser: any = await sequelize.transaction(async (t) => {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const created = await User.create({
                org_id: req.user.org_id,
                role_id,
                email,
                username,
                first_name,
                last_name,
                phone,
                password_hash
            }, { transaction: t });

            return created;
        });

        const createdUser = await User.findByPk(newUser.id, { include: [{ model: Role }] });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'User',
            entityId: newUser.id,
            action: 'create',
            newValues: { email: newUser.email }
        });

        res.status(201).json(createdUser);
    } catch (err) {
        next(err);
    }
});

router.get('/:user_id', async (req: any, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.user_id, org_id: req.user.org_id },
            include: [{ model: Role }]
        });
        if (!user) {
            res.status(404).json({ detail: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.put('/:user_id', requireRole(ADMIN_ROLES), validate(UpdateUserSchema), async (req: any, res, next) => {
    try {
        const user: any = await User.findOne({
            where: { id: req.params.user_id, org_id: req.user.org_id },
            include: [{ model: Role }]
        });

        if (!user) {
            res.status(404).json({ detail: 'User not found' });
            return;
        }

        const updateData = req.body;

        if (updateData.role_id) {
            const role = await Role.findOne({ where: { id: updateData.role_id, org_id: req.user.org_id } });
            if (role) {
                const requestorRole = req.user.Role?.name?.toLowerCase() || req.user.role?.name?.toLowerCase();
                if (['org_admin', 'admin'].includes(requestorRole) && ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
                    res.status(403).json({ detail: 'You cannot assign Super Admin or Org Admin roles' });
                    return;
                }
            }
        }

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(updateData.password, salt);
            delete updateData.password;
        }

        await user.update(updateData);
        await user.reload();

        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.delete('/:user_id', requireRole(ADMIN_ROLES), async (req: any, res, next) => {
    try {
        const user: any = await User.findOne({
            where: { id: req.params.user_id, org_id: req.user.org_id },
            paranoid: false
        });

        if (!user) {
            res.status(404).json({ detail: 'User not found' });
            return;
        }

        if (user.deleted_at === null && user.is_active !== false) {
            await sequelize.transaction(async (t) => {
                user.is_active = false;
                await user.save({ transaction: t });
                await user.destroy({ transaction: t });
            });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'User',
                entityId: req.params.user_id,
                action: 'delete'
            });

            res.json({ message: 'User deactivated' });
        } else {
            await user.destroy({ force: true });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'User',
                entityId: req.params.user_id,
                action: 'hard_delete'
            });

            res.json({ message: 'User permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(ADMIN_ROLES), validate(BulkDeleteSchema), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;

        // Prevent users from deleting themselves in bulk
        const idx = ids.indexOf(req.user.id);
        if (idx !== -1) {
             ids.splice(idx, 1);
        }
        
        if (ids.length === 0) {
            res.status(400).json({ detail: 'Cannot perform bulk delete exclusively on yourself.' });
            return;
        }

        // Keep is_active syncing for soft deletes
        if (!force) {
            await User.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: req.user.org_id } });
        }
        const deletedCount = await User.destroy({
            where: {
                id: { [Op.in]: ids },
                org_id: req.user.org_id
            },
            force: force
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'User',
            entityId: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            newValues: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Users successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

export default router;
