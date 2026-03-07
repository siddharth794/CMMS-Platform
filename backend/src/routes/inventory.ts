import { Router } from 'express';
import { InventoryItem, AuditLog } from '../models';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, search, category, low_stock_only, record_status } = req.query;
        let where: any = { org_id: req.user.org_id };

        const { Op } = require('sequelize');

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

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { sku: { [Op.like]: `%${search}%` } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (low_stock_only === 'true') {
            where.min_quantity = { [Op.gt]: 0 };
            where.quantity = { [Op.lte]: { [Op.col]: 'min_quantity' } };
        }

        const items = await InventoryItem.findAndCountAll({
            where,
            paranoid,
            offset: Number(skip),
            limit: Number(limit)
        });
        res.json({
            data: items.rows,
            total: items.count,
            skip: Number(skip),
            limit: Number(limit)
        });
    } catch (err) {
        next(err);
    }
});

router.get('/stats', async (req: any, res, next) => {
    try {
        const org_id = req.user.org_id;

        // Use Sequelize to count and sum
        const total_items = await InventoryItem.count({ where: { org_id, is_active: true } });

        // Count low stock items where quantity <= min_quantity and min_quantity > 0
        const { Op } = require('sequelize');
        const low_stock_count = await InventoryItem.count({
            where: {
                org_id,
                is_active: true,
                min_quantity: { [Op.gt]: 0 },
                quantity: { [Op.lte]: { [Op.col]: 'min_quantity' } }
            }
        });

        // Calculate total value by summing (quantity * unit_cost)
        // For simplicity with sqlite/mysql differences, we can fetch all and reduce in memory
        // since inventory sizes are typically small enough for this demo
        const allItems = await InventoryItem.findAll({ where: { org_id, is_active: true } });
        const total_value = allItems.reduce((acc: number, item: any) => {
            const qty = item.quantity || 0;
            const cost = parseFloat(item.unit_cost) || 0;
            return acc + (qty * cost);
        }, 0);

        res.json({ total_items, low_stock_count, total_value });
    } catch (err) {
        next(err);
    }
});

router.get('/categories', async (req: any, res, next) => {
    try {
        const org_id = req.user.org_id;

        // Get distinct categories
        const items = await InventoryItem.findAll({
            attributes: ['category'],
            where: { org_id, is_active: true },
            group: ['category']
        });

        const categories = items.map((item: any) => item.category).filter(Boolean);
        res.json({ categories });
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
            where: { id: req.params.item_id, org_id: req.user.org_id },
            paranoid: false
        });
        if (!item) {
            res.status(404).json({ detail: 'Inventory item not found' });
            return;
        }

        if (item.deleted_at === null && item.is_active !== false) {
            item.is_active = false;
            await item.save();
            await item.destroy();

            await AuditLog.create({
                org_id: req.user.org_id,
                user_id: req.user.id,
                user_email: req.user.email,
                entity_type: 'InventoryItem',
                entity_id: item.id,
                action: 'delete'
            });

            res.json({ message: 'Inventory item deactivated' });
        } else {
            await item.destroy({ force: true });
            
            await AuditLog.create({
                org_id: req.user.org_id,
                user_id: req.user.id,
                user_email: req.user.email,
                entity_type: 'InventoryItem',
                entity_id: item.id,
                action: 'hard_delete'
            });
            res.json({ message: 'Inventory item permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager']), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ detail: 'No Inventory Item IDs provided for bulk delete.' });
            return;
        }

        const { Op } = require('sequelize');

        // Keep is_active syncing for soft deletes
        if (!force) {
            await InventoryItem.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: req.user.org_id } });
        }
        const deletedCount = await InventoryItem.destroy({
            where: {
                id: { [Op.in]: ids },
                org_id: req.user.org_id
            },
            force: force // true = hard delete, false/undefined = soft delete
        });

        await AuditLog.create({
            org_id: req.user.org_id,
            user_id: req.user.id,
            user_email: req.user.email,
            entity_type: 'InventoryItem',
            entity_id: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            new_values: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Inventory Items successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

export default router;
