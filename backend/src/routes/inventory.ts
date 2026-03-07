import { Router } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { InventoryItem, sequelize } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateInventoryItemSchema, UpdateInventoryItemSchema, BulkDeleteSchema } from '../validators/inventory.validator';
import { auditService } from '../services/audit.service';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res, next) => {
    try {
        const { skip = 0, limit = 100, search, category, low_stock_only, record_status } = req.query;
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
            where.quantity = { [Op.lte]: literal('`min_quantity`') };
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

        // Parallel execution of all three stats queries
        const [total_items, low_stock_count, totalValueResult] = await Promise.all([
            InventoryItem.count({ where: { org_id, is_active: true } }),
            InventoryItem.count({
                where: {
                    org_id,
                    is_active: true,
                    min_quantity: { [Op.gt]: 0 },
                    quantity: { [Op.lte]: literal('`min_quantity`') }
                }
            }),
            // DB-level aggregation replaces fetching ALL items into memory
            InventoryItem.findOne({
                attributes: [[fn('SUM', literal('quantity * CAST(unit_cost AS DECIMAL(10,2))')), 'total_value']],
                where: { org_id, is_active: true },
                raw: true,
            }),
        ]);

        const total_value = parseFloat((totalValueResult as any)?.total_value) || 0;
        res.json({ total_items, low_stock_count, total_value });
    } catch (err) {
        next(err);
    }
});

router.get('/categories', async (req: any, res, next) => {
    try {
        const org_id = req.user.org_id;

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

router.post('/', requireRole(MANAGER_ROLES), validate(CreateInventoryItemSchema), async (req: any, res, next) => {
    try {
        const itemData = { ...req.body, org_id: req.user.org_id };
        const item: any = await InventoryItem.create(itemData);

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'InventoryItem',
            entityId: item.id,
            action: 'create',
            newValues: { name: item.name }
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

router.put('/:item_id', requireRole(MANAGER_ROLES), validate(UpdateInventoryItemSchema), async (req: any, res, next) => {
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

router.delete('/:item_id', requireRole(MANAGER_ROLES), async (req: any, res, next) => {
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
            await sequelize.transaction(async (t) => {
                item.is_active = false;
                await item.save({ transaction: t });
                await item.destroy({ transaction: t });
            });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'InventoryItem',
                entityId: item.id,
                action: 'delete'
            });

            res.json({ message: 'Inventory item deactivated' });
        } else {
            await item.destroy({ force: true });

            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'InventoryItem',
                entityId: item.id,
                action: 'hard_delete'
            });
            res.json({ message: 'Inventory item permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;

        if (!force) {
            await InventoryItem.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: req.user.org_id } });
        }
        const deletedCount = await InventoryItem.destroy({
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
            entityType: 'InventoryItem',
            entityId: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            newValues: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Inventory Items successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

export default router;
