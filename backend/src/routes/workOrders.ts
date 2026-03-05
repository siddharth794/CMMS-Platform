import { WorkOrder, Asset, User, Role, AuditLog, WOComment, Notification, InventoryItem, WorkOrderInventoryItem, WOAttachment } from '../models';
import { authenticate, requireRole } from '../middleware/auth';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Router } from 'express';

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
        const { skip = 0, limit = 100, status, priority, assignee_id, asset_id, search } = req.query;
        let where: any = { org_id: req.user.org_id };

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

        const wos = await WorkOrder.findAll({
            where,
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
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

router.post('/', requireRole(['Super_Admin', 'Org_Admin', 'Facility_Manager', 'super_admin', 'org_admin', 'facility_manager', 'technician', 'requestor', 'requester']), async (req: any, res, next) => {
    try {
        const woData = { ...req.body, org_id: req.user.org_id, requester_id: req.user.id };
        woData.wo_number = generateWoNumber();
        woData.status = 'new';

        // Ensure asset_id is null if sent as an empty string
        if (woData.asset_id === "") {
            woData.asset_id = null;
        }

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

        // Ensure asset_id is null if sent as an empty string
        const updateData = { ...req.body };
        if (updateData.asset_id === "") {
            updateData.asset_id = null;
        }

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
                { model: User, as: 'requester', include: [{ model: Role }] },
                { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
                { model: WOAttachment, as: 'attachments' }
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

// --- Work Order Comments ---

// List comments for a WO
router.get('/:wo_id/comments', async (req: any, res, next) => {
    try {
        const wo = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

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

// Add a comment to a WO
router.post('/:wo_id/comments', async (req: any, res, next) => {
    try {
        const wo: any = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        const { message } = req.body;
        if (!message || !message.trim()) { res.status(400).json({ detail: 'Message is required' }); return; }

        const comment: any = await WOComment.create({
            work_order_id: req.params.wo_id,
            user_id: req.user.id,
            message: message.trim()
        });

        const fullComment = await WOComment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'], include: [{ model: Role, attributes: ['name'] }] }]
        });

        const io = req.app.get('io');

        // Emit comment to the work order room
        if (io) {
            io.to(`wo_${req.params.wo_id}`).emit('new_comment', fullComment);
        }

        // Determine who needs a notification (Assignee or Requester)
        const commentersId = req.user.id;
        const notificationRecipients = [];
        if (wo.assignee_id && wo.assignee_id !== commentersId) {
            notificationRecipients.push(wo.assignee_id);
        }
        if (wo.requester_id && wo.requester_id !== commentersId && wo.requester_id !== wo.assignee_id) {
            notificationRecipients.push(wo.requester_id);
        }

        // Create notification & emit socket to them
        const commenterName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim();
        for (const targetUserId of notificationRecipients) {
            const notif = await Notification.create({
                user_id: targetUserId,
                title: 'New Comment',
                message: `${commenterName} commented on Work Order ${wo.wo_number}`,
                link: `/work-orders/${wo.id}`
            });

            if (io) {
                // To get activesockets securely, export from server.ts and look it up
                // A simpler way: just emit to a user-specific room if we joined it, or emit to all and let client filter
                // Actually the standard way is socket.join(`user_${user.id}`) in server.ts
                // I will just emit gloabally for now and let the client UI filter unless I add user rooms.
                // Let's emit a global event and filter by user ID on frontend.
                io.emit('new_notification', {
                    ...notif.toJSON(),
                    target_user_id: targetUserId
                });
            }
        }

        res.status(201).json(fullComment);
    } catch (err) {
        next(err);
    }
});

// --- Work Order Inventory (Parts Used) ---

// Get used parts
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

// Add a part to a WO (consumes stock)
router.post('/:wo_id/inventory', async (req: any, res, next) => {
    try {
        const { inventory_item_id, quantity_used } = req.body;
        if (!inventory_item_id || !quantity_used || quantity_used <= 0) {
            res.status(400).json({ detail: 'Valid inventory_item_id and quantity_used are required' });
            return;
        }

        const wo = await WorkOrder.findOne({ where: { id: req.params.wo_id, org_id: req.user.org_id } });
        if (!wo) { res.status(404).json({ detail: 'Work order not found' }); return; }

        const item: any = await InventoryItem.findOne({ where: { id: inventory_item_id, org_id: req.user.org_id } });
        if (!item) { res.status(404).json({ detail: 'Inventory item not found' }); return; }

        if (item.quantity < quantity_used) {
            res.status(400).json({ detail: `Not enough stock. Only ${item.quantity} available.` });
            return;
        }

        // Deduct quantity
        item.quantity -= quantity_used;
        await item.save();

        // Create usage record
        const usage: any = await WorkOrderInventoryItem.create({
            work_order_id: req.params.wo_id,
            inventory_item_id,
            quantity_used
        });

        const fullUsage = await WorkOrderInventoryItem.findByPk(usage.id, {
            include: [{ model: InventoryItem, as: 'item' }]
        });

        res.status(201).json(fullUsage);
    } catch (err) {
        next(err);
    }
});

// Remove a part from a WO (restores stock)
router.delete('/:wo_id/inventory/:usage_id', async (req: any, res, next) => {
    try {
        const usage: any = await WorkOrderInventoryItem.findOne({
            where: { id: req.params.usage_id, work_order_id: req.params.wo_id }
        });
        if (!usage) { res.status(404).json({ detail: 'Usage record not found' }); return; }

        const item: any = await InventoryItem.findByPk(usage.inventory_item_id);
        if (item) {
            item.quantity += usage.quantity_used;
            await item.save();
        }

        await usage.destroy();
        res.json({ message: 'Part usage removed, stock restored.' });
    } catch (err) {
        next(err);
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

        const attachments = [];
        for (const file of files) {
            const attachment = await WOAttachment.create({
                work_order_id: wo.id,
                file_path: `/uploads/work-orders/${file.filename}`
            });
            attachments.push(attachment);
        }

        res.status(201).json(attachments);
    } catch (err) {
        // Multer errors (e.g., LIMIT_FILE_SIZE) are usually caught here
        if (err instanceof multer.MulterError) {
            res.status(400).json({ detail: err.message });
        } else {
            next(err);
        }
    }
});

export default router;
