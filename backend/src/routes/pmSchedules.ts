import { Router } from 'express';
import { PMSchedule, Asset, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, asset_id } = req.query;
        let where: any = { org_id: req.user.org_id, is_active: true };

        if (asset_id) where.asset_id = asset_id;

        const pms = await PMSchedule.findAll({
            where,
            include: [{ model: Asset }],
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(pms);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const pmData = { ...req.body, org_id: req.user.org_id };
        const pm: any = await PMSchedule.create(pmData);

        const fullyLoadedPm = await PMSchedule.findByPk(pm.id, { include: [{ model: Asset }] });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'PMSchedule',
            entity_id: pm.id,
            action: 'create',
            new_values: { name: pm.name }
        });

        res.status(201).json(fullyLoadedPm);
    } catch (err) {
        next(err);
    }
});

router.get('/:pm_id', async (req: any, res, next) => {
    try {
        const pm = await PMSchedule.findOne({
            where: { id: req.params.pm_id, org_id: req.user.org_id },
            include: [{ model: Asset }]
        });
        if (!pm) {
            res.status(404).json({ detail: 'PM schedule not found' });
            return;
        }
        res.json(pm);
    } catch (err) {
        next(err);
    }
});

router.put('/:pm_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const pm: any = await PMSchedule.findOne({
            where: { id: req.params.pm_id, org_id: req.user.org_id }
        });
        if (!pm) {
            res.status(404).json({ detail: 'PM schedule not found' });
            return;
        }

        await pm.update(req.body);

        const fullyLoadedPm = await PMSchedule.findByPk(pm.id, { include: [{ model: Asset }] });
        res.json(fullyLoadedPm);
    } catch (err) {
        next(err);
    }
});

router.delete('/:pm_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const pm: any = await PMSchedule.findOne({
            where: { id: req.params.pm_id, org_id: req.user.org_id }
        });
        if (!pm) {
            res.status(404).json({ detail: 'PM schedule not found' });
            return;
        }

        pm.is_active = false;
        await pm.save();

        res.json({ message: 'PM schedule deactivated' });
    } catch (err) {
        next(err);
    }
});

export default router;
