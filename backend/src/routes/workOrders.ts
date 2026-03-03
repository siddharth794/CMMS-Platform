import { Router } from 'express';
import { WorkOrder, Asset, User, Role, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();
router.use(authenticate);

function generateWoNumber() {
    const prefix = "WO";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${date}-${randomSuffix}`;
}

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, status, priority, assignee_id, asset_id } = req.query;
        let where: any = { org_id: req.user.org_id };

        const roleName = req.user.Role?.name?.toLowerCase();
        if (roleName === "technician") where.assignee_id = req.user.id;
        else if (roleName === "requestor") where.requester_id = req.user.id;

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignee_id) where.assignee_id = assignee_id;
        if (asset_id) where.asset_id = asset_id;

        const wos = await WorkOrder.findAll({
            where,
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ],
            order: [['created_at', 'DESC']],
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(wos);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req: any, res, next) => {
    try {
        const woData = { ...req.body, org_id: req.user.org_id, requester_id: req.user.id };
        woData.wo_number = generateWoNumber();
        woData.status = 'new';

        const wo: any = await WorkOrder.create(woData);

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ]
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'WorkOrder',
            entity_id: wo.id,
            action: 'create',
            new_values: { wo_number: wo.wo_number, title: wo.title }
        });

        res.status(201).json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.get('/:wo_id', async (req: any, res, next) => {
    try {
        const wo = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id },
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ]
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }
        res.json(wo);
    } catch (err) {
        next(err);
    }
});

router.put('/:wo_id', async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        const oldStatus = wo.status;
        await wo.update(req.body);

        if (req.body.status && req.body.status !== oldStatus) {
            if (req.body.status === 'in_progress' && !wo.actual_start) wo.actual_start = new Date();
            else if (req.body.status === 'completed' && !wo.actual_end) wo.actual_end = new Date();
            await wo.save();
        }

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ]
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'WorkOrder',
            entity_id: wo.id,
            action: 'update',
            old_values: { status: oldStatus },
            new_values: req.body
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.patch('/:wo_id/status', async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        const oldStatus = wo.status;
        const newStatus = req.body.status;
        wo.status = newStatus;

        if (req.body.notes) {
            wo.notes = (wo.notes || "") + `\n[${new Date().toISOString()}] Status changed to ${newStatus}: ${req.body.notes}`;
        }

        if (newStatus === 'in_progress' && !wo.actual_start) wo.actual_start = new Date();
        else if (newStatus === 'completed' && !wo.actual_end) wo.actual_end = new Date();

        await wo.save();

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ]
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'WorkOrder',
            entity_id: wo.id,
            action: 'status_change',
            old_values: { status: oldStatus },
            new_values: { status: newStatus }
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.patch('/:wo_id/assign', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        wo.assignee_id = req.body.assignee_id;
        if (wo.status === 'new') wo.status = 'open';

        await wo.save();

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ]
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'WorkOrder',
            entity_id: wo.id,
            action: 'assign',
            new_values: { assignee_id: req.body.assignee_id }
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.delete('/:wo_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        wo.status = 'cancelled';
        await wo.save();

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'WorkOrder',
            entity_id: wo.id,
            action: 'cancel'
        });

        res.json({ message: 'Work order cancelled' });
    } catch (err) {
        next(err);
    }
});

export default router;
