import { Router } from 'express';
import { Organization, Role, User } from '../models';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrganizationSchema } from '../validators/organization.validator';
import { sequelize } from '../models';
import { ROLES } from '../constants/roles';

const router = Router();

router.post('/', validate(CreateOrganizationSchema), async (req, res, next) => {
    try {
        const { name, description, address } = req.body;

        const existing = await Organization.findOne({ where: { name } });
        if (existing) {
            res.status(400).json({ detail: 'Organization name already exists' });
            return;
        }

        const org: any = await sequelize.transaction(async (t) => {
            const newOrg = await Organization.create({ name, description, address }, { transaction: t });

            const defaultRoles = [
                { name: "Super_Admin", description: "Full system access", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
                { name: "Org_Admin", description: "Organization administrator", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
                { name: "Facility_Manager", description: "Manages facilities and work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true, "write": true }, "pm_schedules": { "read": true, "write": true }, "analytics": { "read": true } }, is_system_role: true },
                { name: "Technician", description: "Executes work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true },
                { name: "Requestor", description: "Creates and tracks work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true }
            ];

            for (const roleData of defaultRoles) {
                await Role.create({
                    org_id: (newOrg as any).id,
                    ...roleData
                }, { transaction: t });
            }

            return newOrg;
        });

        res.status(201).json(org);
    } catch (err) {
        next(err);
    }
});

router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        if (req.user.Role?.name?.toLowerCase() !== ROLES.SUPER_ADMIN) {
            res.status(403).json({ detail: 'Access denied' });
            return;
        }

        const orgs = await Organization.findAll({
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(orgs);
    } catch (err) {
        next(err);
    }
});

router.get('/:org_id', async (req: any, res, next) => {
    try {
        if (req.user.org_id !== req.params.org_id && req.user.Role?.name?.toLowerCase() !== ROLES.SUPER_ADMIN) {
            res.status(403).json({ detail: 'Access denied' });
            return;
        }

        const org = await Organization.findByPk(req.params.org_id);
        if (!org) {
            res.status(404).json({ detail: 'Organization not found' });
            return;
        }
        res.json(org);
    } catch (err) {
        next(err);
    }
});

export default router;
