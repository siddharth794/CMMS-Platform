import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    CreateWorkOrderSchema, UpdateWorkOrderSchema, StatusUpdateSchema,
    AssignSchema, CommentSchema, InventoryUsageSchema, BulkDeleteSchema
} from '../validators/workOrder.validator';
import { workOrderController, upload } from '../controllers/workOrder.controller';
import { ALL_WO_ROLES, MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

// ─── Main CRUD ────────────────────────────────────────────────────
router.get('/', workOrderController.getAll);
router.post('/', requireRole(ALL_WO_ROLES), validate(CreateWorkOrderSchema), workOrderController.create);
router.get('/:wo_id', workOrderController.getById);
router.put('/:wo_id', requireRole(MANAGER_ROLES), validate(UpdateWorkOrderSchema), workOrderController.update);
router.patch('/:wo_id/status', validate(StatusUpdateSchema), workOrderController.updateStatus);
router.patch('/:wo_id/assign', requireRole(MANAGER_ROLES), validate(AssignSchema), workOrderController.assign);
router.delete('/:wo_id', requireRole(MANAGER_ROLES), workOrderController.delete);
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), workOrderController.bulkDelete);

// ─── Comments ─────────────────────────────────────────────────────
router.get('/:wo_id/comments', workOrderController.getComments);
router.post('/:wo_id/comments', validate(CommentSchema), workOrderController.addComment);

// ─── Inventory Usage ──────────────────────────────────────────────
router.get('/:wo_id/inventory', workOrderController.getUsedParts);
router.post('/:wo_id/inventory', validate(InventoryUsageSchema), workOrderController.addInventoryUsage);
router.delete('/:wo_id/inventory/:usage_id', workOrderController.removeInventoryUsage);

// ─── Attachments ──────────────────────────────────────────────────
router.post('/:wo_id/attachments', upload.array('images', 3), workOrderController.addAttachments);

export default router;
