import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Role, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        const users = await User.findAll({
            where: { org_id: req.user.org_id },
            include: [{ model: Role }],
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(users);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(['Super_Admin', 'Org_Admin', 'super_admin', 'org_admin']), async (req: any, res, next) => {
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
        if (requestorRole === 'org_admin' && ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
            res.status(403).json({ detail: 'Org Admins cannot assign Super Admin or Org Admin roles' });
            return;
        }

        const salt = bcrypt.genSaltSync(10);
        const password_hash = bcrypt.hashSync(password, salt);

        const newUser: any = await User.create({
            org_id: req.user.org_id,
            role_id,
            email,
            username,
            first_name,
            last_name,
            phone,
            password_hash
        });

        const createdUser = await User.findByPk(newUser.id, { include: [{ model: Role }] });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'User',
            entity_id: newUser.id,
            action: 'create',
            new_values: { email: newUser.email }
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

router.put('/:user_id', requireRole(['Super_Admin', 'Org_Admin', 'super_admin', 'org_admin']), async (req: any, res, next) => {
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
                if (requestorRole === 'org_admin' && ['super_admin', 'org_admin'].includes(role.name.toLowerCase())) {
                    res.status(403).json({ detail: 'Org Admins cannot assign Super Admin or Org Admin roles' });
                    return;
                }
            }
        }

        if (updateData.password) {
            const salt = bcrypt.genSaltSync(10);
            updateData.password_hash = bcrypt.hashSync(updateData.password, salt);
            delete updateData.password;
        }

        await user.update(updateData);
        await user.reload();

        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.delete('/:user_id', requireRole(['Super_Admin', 'Org_Admin', 'super_admin', 'org_admin']), async (req: any, res, next) => {
    try {
        const user: any = await User.findOne({
            where: { id: req.params.user_id, org_id: req.user.org_id }
        });

        if (!user) {
            res.status(404).json({ detail: 'User not found' });
            return;
        }

        user.is_active = false;
        await user.save();

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'User',
            entity_id: req.params.user_id,
            action: 'delete'
        });

        res.json({ message: 'User deactivated' });
    } catch (err) {
        next(err);
    }
});

export default router;
