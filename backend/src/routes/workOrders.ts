import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WorkOrder, Asset, User, Role, WorkOrderInventoryItem, InventoryItem, WOAttachment, sequelize } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    CreateWorkOrderSchema,
    UpdateWorkOrderSchema,
    StatusUpdateSchema,
    AssignSchema,
    CommentSchema,
    InventoryUsageSchema,
    BulkDeleteSchema
} from '../validators/workOrder.validator';
import { auditService } from '../services/audit.service';
import { notificationService } from '../services/notification.service';
import { ALL_WO_ROLES, MANAGER_ROLES } from '../constants/roles';
import { Op } from 'sequelize';

const uploadDir = path.join(__dirname, '../../uploads/work-orders');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024, files: 3 } // 1MB, 3 files
});

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
        const { skip = 0, limit = 100, status, priority, assignee_id, asset_id, search, record_status } = req.query;
        let where: any = { org_id: req.user.org_id };

        let paranoid = true;
        if (record_status === 'inactive') {
            paranoid = false;
            where.deleted_at = { [Op.not]: null };
        }

        const roleName = req.user.Role?.name?.toLowerCase();
        if (roleName === "technician") where.assignee_id = req.user.id;
        else if (['requestor', 'requester'].includes(roleName)) where.requester_id = req.user.id;

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignee_id) where.assignee_id = assignee_id;
        if (asset_id) where.asset_id = asset_id;

        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const wos = await WorkOrder.findAndCountAll({
            where,
            paranoid,
            include: [
                { model: Asset, paranoid: false },
                { model: User, as: 'assignee', required: false, paranoid: false, include: [{ model: Role, required: false }] },
                { model: User, as: 'requester', required: false, paranoid: false, include: [{ model: Role, required: false }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', required: false, include: [{ model: InventoryItem, as: 'item', required: false }] },
                { model: WOAttachment, as: 'attachments', required: false }
            ],
            order: [['created_at', 'DESC']],
            offset: Number(skip),
            limit: Number(limit),
            distinct: true
        });
        res.json({
            data: wos.rows,
            total: wos.count,
            skip: Number(skip),
            limit: Number(limit)
        });
    } catch (err) {
        next(err);
    }
});

router.post('/', requireRole(ALL_WO_ROLES), validate(CreateWorkOrderSchema), async (req: any, res, next) => {
    try {
        const woData = { ...req.body, org_id: req.user.org_id, requester_id: req.user.id };
        woData.wo_number = generateWoNumber();
        woData.status = 'new';

        if (woData.asset_id === "") woData.asset_id = null;

        const wo: any = await WorkOrder.create(woData);

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
            ]
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'WorkOrder',
            entityId: wo.id,
            action: 'create',
            newValues: { wo_number: wo.wo_number, title: wo.title }
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
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
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

router.put('/:wo_id', requireRole(MANAGER_ROLES), validate(UpdateWorkOrderSchema), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        const oldStatus = wo.status;

        const updateData = { ...req.body };
        if (updateData.asset_id === "") updateData.asset_id = null;

        await wo.update(updateData);

        if (req.body.status && req.body.status !== oldStatus) {
            if (req.body.status === 'in_progress' && !wo.actual_start) wo.actual_start = new Date();
            else if (req.body.status === 'completed' && !wo.actual_end) wo.actual_end = new Date();
            await wo.save();
        }

        const fullyLoadedWo = await WorkOrder.findByPk(wo.id, {
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
            ]
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'WorkOrder',
            entityId: wo.id,
            action: 'update',
            oldValues: { status: oldStatus },
            newValues: req.body
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.patch('/:wo_id/status', validate(StatusUpdateSchema), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id }
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        const newStatus = req.body.status;

        if (newStatus === 'completed') {
            const attachmentCount = await WOAttachment.count({ where: { work_order_id: wo.id } });
            if (attachmentCount === 0) {
                res.status(400).json({ detail: 'Cannot mark as completed without uploading at least one image/attachment.' });
                return;
            }
        }

        const oldStatus = wo.status;
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
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
            ]
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'WorkOrder',
            entityId: wo.id,
            action: 'status_change',
            oldValues: { status: oldStatus },
            newValues: { status: newStatus }
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.patch('/:wo_id/assign', requireRole(MANAGER_ROLES), validate(AssignSchema), async (req: any, res, next) => {
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
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
            ]
        });

        auditService.log({
            orgId: req.user.org_id,
            userId: req.user.id,
            userEmail: req.user.email,
            entityType: 'WorkOrder',
            entityId: wo.id,
            action: 'assign',
            newValues: { assignee_id: req.body.assignee_id }
        });

        res.json(fullyLoadedWo);
    } catch (err) {
        next(err);
    }
});

router.delete('/:wo_id', requireRole(MANAGER_ROLES), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({
            where: { id: req.params.wo_id, org_id: req.user.org_id },
            paranoid: false
        });
        if (!wo) {
            res.status(404).json({ detail: 'Work order not found' });
            return;
        }

        if (wo.deleted_at === null) {
            await wo.destroy();
            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'WorkOrder',
                entityId: wo.id,
                action: 'delete'
            });
            res.json({ message: 'Work order deactivated (soft delete)' });
        } else {
            await wo.destroy({ force: true });
            auditService.log({
                orgId: req.user.org_id,
                userId: req.user.id,
                userEmail: req.user.email,
                entityType: 'WorkOrder',
                entityId: wo.id,
                action: 'hard_delete'
            });
            res.json({ message: 'Work order permanently deleted' });
        }
    } catch (err) {
        next(err);
    }
});

router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), async (req: any, res, next) => {
    try {
        const { ids, force } = req.body;
        
        const deletedCount = await WorkOrder.destroy({
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
            entityType: 'WorkOrder',
            entityId: ids[0],
            action: force ? 'bulk_hard_delete' : 'bulk_delete',
            newValues: { deleted_ids: ids, count: deletedCount }
        });

        res.json({ message: `${deletedCount} Work Orders OS successfully ${force ? 'permanently deleted' : 'deactivated'}.` });
    } catch (err) {
        next(err);
    }
});

// --- Work Order Comments ---

router.get('/:wo_id/comments', async (req: any, res, next) => {
    try {
        const wo = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        // Needs to be imported properly from modes (which it currently isn't in original file without explicit require/import)
        // Let's assume WOComment is imported (which it is on line 1)
        const { WOComment } = require('../models');

        const comments = await WOComment.findAll({
            where: { work_order_id: req.params.wo_id },
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'], include: [{ model: Role, attributes: ['name'] }] }],
            order: [['created_at', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        next(err);
    }
});

router.post('/:wo_id/comments', validate(CommentSchema), async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        const { message } = req.body;
        const { WOComment } = require('../models');

        const comment: any = await WOComment.create({
            work_order_id: req.params.wo_id,
            user_id: req.user.id,
            message: message.trim()
        });

        const fullComment = await WOComment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'], include: [{ model: Role, attributes: ['name'] }] }]
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`wo_${req.params.wo_id}`).emit('new_comment', fullComment);
        }

        // Fire and forget notification
        notificationService.notifyCommentAdded({
            workOrder: wo,
            commenter: req.user,
            io
        });

        res.status(201).json(fullComment);
    } catch (err) {
        next(err);
    }
});

// --- Work Order Inventory (Parts Used) ---

router.get('/:wo_id/inventory', async (req: any, res, next) => {
    try {
        const parts = await WorkOrderInventoryItem.findAll({
            where: { work_order_id: req.params.wo_id },
            include: [{ model: InventoryItem, as: 'item' }],
            order: [['created_at', 'ASC']]
        });
        res.json(parts);
    } catch (err) {
        next(err);
    }
});

router.post('/:wo_id/inventory', validate(InventoryUsageSchema), async (req: any, res, next) => {
    try {
        const { inventory_item_id, quantity_used } = req.body;

        const wo = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        const fullUsage = await sequelize.transaction(async (t) => {
            // Lock the inventory item to prevent race conditions during check and deduct
            const item: any = await InventoryItem.findOne({ 
                where: { id: inventory_item_id, org_id: req.user.org_id },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (!item) { throw new Error('Inventory item not found'); }
            if (item.quantity < quantity_used) {
                throw new Error(`Not enough stock. Only ${item.quantity} available.`);
            }

            item.quantity -= quantity_used;
            await item.save({ transaction: t });

            const usage: any = await WorkOrderInventoryItem.create({
                work_order_id: req.params.wo_id,
                inventory_item_id,
                quantity_used
            }, { transaction: t });

            return await WorkOrderInventoryItem.findByPk(usage.id, {
                include: [{ model: InventoryItem, as: 'item' }],
                transaction: t
            });
        });

        res.status(201).json(fullUsage);
    } catch (err: any) {
        if (err.message.includes('stock') || err.message.includes('not found')) {
            res.status(400).json({ detail: err.message });
        } else {
            next(err);
        }
    }
});

router.delete('/:wo_id/inventory/:usage_id', async (req: any, res, next) => {
    try {
        await sequelize.transaction(async (t) => {
            const usage: any = await WorkOrderInventoryItem.findOne({
                where: { id: req.params.usage_id, work_order_id: req.params.wo_id },
                transaction: t
            });
            if (!usage) { throw new Error('Usage record not found'); }

            const item: any = await InventoryItem.findOne({
                where: { id: usage.inventory_item_id },
                lock: t.LOCK.UPDATE,
                transaction: t
            });

            if (item) {
                item.quantity += usage.quantity_used;
                await item.save({ transaction: t });
            }

            await usage.destroy({ transaction: t });
        });

        res.json({ message: 'Part usage removed, stock restored.' });
    } catch (err: any) {
        if (err.message.includes('not found')) {
            res.status(404).json({ detail: err.message });
        } else {
            next(err);
        }
    }
});

// --- Attachments / Image Uploads ---

router.post('/:wo_id/attachments', upload.array('images', 3), async (req: any, res, next) => {
    try {
        const wo = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ detail: 'No files uploaded. Ensure images are < 1MB and max 3 files.' });
            return;
        }

        const attachments = await sequelize.transaction(async (t) => {
            const results = [];
            for (const file of files) {
                const attachment = await WOAttachment.create({
                    work_order_id: wo.id,
                    file_path: `/uploads/work-orders/${file.filename}`
                }, { transaction: t });
                results.push(attachment);
            }
            return results;
        });

        res.status(201).json(attachments);
    } catch (err) {
        if (err instanceof multer.MulterError) {
            res.status(400).json({ detail: err.message });
        } else {
            next(err);
        }
    }
});

export default router;
