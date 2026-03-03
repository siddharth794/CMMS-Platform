import { Router } from 'express';
import { InventoryItem, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100 } = req.query;
        let where: any = { org_id: req.user.org_id, is_active: true };

        const items = await InventoryItem.findAll({
            where,
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json(items);
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const itemData = { ...req.body, org_id: req.user.org_id };
        const item: any = await InventoryItem.create(itemData);

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'InventoryItem',
            entity_id: item.id,
            action: 'create',
            new_values: { name: item.name }
        });

        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
});

router.get('/:item_id', async (req: any, res, next) => {
    try {
        const item = await InventoryItem.findOne({
            where: { id: req.params.item_id, org_id: req.user.org_id }
        });
        if (!item) {
            res.status(404).json({ detail: 'Inventory item not found' });
            return;
        }
        res.json(item);
    } catch (err) {
        next(err);
    }
});

router.put('/:item_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const item: any = await InventoryItem.findOne({
            where: { id: req.params.item_id, org_id: req.user.org_id }
        });
        if (!item) {
            res.status(404).json({ detail: 'Inventory item not found' });
            return;
        }

        await item.update(req.body);
        res.json(item);
    } catch (err) {
        next(err);
    }
});

router.delete('/:item_id', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const item: any = await InventoryItem.findOne({
            where: { id: req.params.item_id, org_id: req.user.org_id }
        });
        if (!item) {
            res.status(404).json({ detail: 'Inventory item not found' });
            return;
        }

        item.is_active = false;
        await item.save();

        res.json({ message: 'Inventory item deactivated' });
    } catch (err) {
        next(err);
    }
});

export default router;
