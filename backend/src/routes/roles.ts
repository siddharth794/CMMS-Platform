import { Router } from 'express';
import { Role } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateRoleSchema, UpdateRoleSchema } from '../validators/role.validator';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const roles = await Role.findAll({
            where: { org_id: req.user.org_id, is_active: true }
        });
        res.json(roles);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(ADMIN_ROLES), validate(CreateRoleSchema), async (req: any, res, next) => {
    try {
        const { name, description, permissions } = req.body;
        const role = await Role.create({
            org_id: req.user.org_id,
            name,
            description,
            permissions
        });
        res.status(201).json(role);
    } catch (err) {
        next(err);
    }
});

router.put('/:role_id', requireRole(ADMIN_ROLES), validate(UpdateRoleSchema), async (req: any, res, next) => {
    try {
        const role: any = await Role.findOne({
            where: { id: req.params.role_id, org_id: req.user.org_id }
        });

        if (!role) {
            res.status(404).json({ detail: 'Role not found' });
            return;
        }

        if (role.is_system_role) {
            res.status(400).json({ detail: 'Cannot modify system roles' });
            return;
        }

        await role.update(req.body);
        res.json(role);
    } catch (err) {
        next(err);
    }
});

export default router;
