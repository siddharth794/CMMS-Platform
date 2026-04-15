import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    CreateWorkOrderSchema, UpdateWorkOrderSchema, StatusUpdateSchema,
    AssignSchema, CommentSchema, InventoryUsageSchema, BulkDeleteSchema
} from '../validators/workOrder.validator';
import { workOrderController, upload } from '../controllers/workOrder.controller';
import { ALL_WO_ROLES, MANAGER_ROLES, ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /work-orders:
 *   get:
 *     summary: Get all work orders
 *     description: Retrieve all work orders (filtered by user role and organization)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/WorkOrderStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/WorkOrderPriority'
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: asset_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of work orders
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', workOrderController.getAll);

/**
 * @swagger
 * /work-orders:
 *   post:
 *     summary: Create a new work order
 *     description: Create a new work order. Role determines required fields.
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Work order title
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               org_id:
 *                 type: string
 *                 format: uuid
 *                 description: Organization ID (required for super_admin)
 *               asset_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               site_id:
 *                 type: string
 *                 format: uuid
 *                 description: Site ID (required based on role)
 *               assignee_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               scheduled_start:
 *                 type: string
 *                 format: date-time
 *               scheduled_end:
 *                 type: string
 *                 format: date-time
 *               estimated_hours:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Work order created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ALL_WO_ROLES), validate(CreateWorkOrderSchema), workOrderController.create);

/**
 * @swagger
 * /work-orders/{wo_id}:
 *   get:
 *     summary: Get work order by ID
 *     description: Retrieve a specific work order with all details
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: Work order details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:wo_id', workOrderController.getById);

/**
 * @swagger
 * /work-orders/{wo_id}:
 *   put:
 *     summary: Update work order
 *     description: Update an existing work order (manager roles only)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               asset_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               site_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               assignee_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [new, open, in_progress, on_hold, pending_review, completed, cancelled]
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               scheduled_start:
 *                 type: string
 *                 format: date-time
 *               scheduled_end:
 *                 type: string
 *                 format: date-time
 *               estimated_hours:
 *                 type: integer
 *               actual_hours:
 *                 type: integer
 *               notes:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Work order updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:wo_id', requireRole(MANAGER_ROLES), validate(UpdateWorkOrderSchema), workOrderController.update);

/**
 * @swagger
 * /work-orders/{wo_id}/status:
 *   patch:
 *     summary: Update work order status
 *     description: Update the status of a work order (managers and technicians)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, open, in_progress, on_hold, pending_review, completed, cancelled]
 *               notes:
 *                 type: string
 *                 maxLength: 5000
 *           example:
 *             status: in_progress
 *             notes: Started working on the issue
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:wo_id/status', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), validate(StatusUpdateSchema), workOrderController.updateStatus);

/**
 * @swagger
 * /work-orders/{wo_id}/assign:
 *   patch:
 *     summary: Assign work order
 *     description: Assign a work order to a user (manager roles only)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignee_id
 *             properties:
 *               assignee_id:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to assign
 *           example:
 *             assignee_id: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Work order assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:wo_id/assign', requireRole(MANAGER_ROLES), validate(AssignSchema), workOrderController.assign);

/**
 * @swagger
 * /work-orders/{wo_id}:
 *   delete:
 *     summary: Delete work order (soft delete)
 *     description: Soft delete a work order (manager roles only)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Skip validation checks
 *     responses:
 *       200:
 *         description: Work order deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:wo_id', requireRole(MANAGER_ROLES), workOrderController.delete);

/**
 * @swagger
 * /work-orders/{wo_id}/restore:
 *   post:
 *     summary: Restore deleted work order
 *     description: Restore a soft-deleted work order (manager roles only)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: Work order restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:wo_id/restore', requireRole(MANAGER_ROLES), workOrderController.restore);

/**
 * @swagger
 * /work-orders/bulk-delete:
 *   post:
 *     summary: Bulk delete work orders
 *     description: Soft delete multiple work orders (manager roles only)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *               force:
 *                 type: boolean
 *                 default: false
 *           example:
 *             ids:
 *               - 550e8400-e29b-41d4-a716-446655440000
 *             force: false
 *     responses:
 *       200:
 *         description: Work orders deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), workOrderController.bulkDelete);

/**
 * @swagger
 * /work-orders/{wo_id}/comments:
 *   get:
 *     summary: Get work order comments
 *     description: Retrieve all comments on a work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: List of comments
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:wo_id/comments', workOrderController.getComments);

/**
 * @swagger
 * /work-orders/{wo_id}/comments:
 *   post:
 *     summary: Add comment to work order
 *     description: Add a new comment to a work order (managers and technicians)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *           example:
 *             message: "Issue investigated. Root cause identified."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:wo_id/comments', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), validate(CommentSchema), workOrderController.addComment);

/**
 * @swagger
 * /work-orders/{wo_id}/inventory:
 *   get:
 *     summary: Get work order inventory usage
 *     description: Retrieve all inventory items used in a work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: List of inventory usage records
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:wo_id/inventory', workOrderController.getUsedParts);

/**
 * @swagger
 * /work-orders/{wo_id}/inventory:
 *   post:
 *     summary: Add inventory usage to work order
 *     description: Record an inventory item being used in a work order (managers and technicians)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventory_item_id
 *               - quantity_used
 *             properties:
 *               inventory_item_id:
 *                 type: string
 *                 format: uuid
 *                 description: Inventory item ID
 *               quantity_used:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity used
 *           example:
 *             inventory_item_id: 550e8400-e29b-41d4-a716-446655440000
 *             quantity_used: 2
 *     responses:
 *       201:
 *         description: Inventory usage added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:wo_id/inventory', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), validate(InventoryUsageSchema), workOrderController.addInventoryUsage);

/**
 * @swagger
 * /work-orders/{wo_id}/inventory/{usage_id}:
 *   delete:
 *     summary: Remove inventory usage
 *     description: Remove an inventory usage record from a work order (managers and technicians)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *       - in: path
 *         name: usage_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory usage ID
 *     responses:
 *       200:
 *         description: Inventory usage removed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:wo_id/inventory/:usage_id', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), workOrderController.removeInventoryUsage);

/**
 * @swagger
 * /work-orders/{wo_id}/attachments:
 *   post:
 *     summary: Add attachments to work order
 *     description: Upload files as attachments to a work order (managers and technicians)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wo_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 3
 *                 description: Image files (max 3, max 1MB each)
 *     responses:
 *       201:
 *         description: Attachments added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:wo_id/attachments', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), upload.array('images', 3), workOrderController.addAttachments);
router.delete('/:wo_id/attachments/:attachment_id', requireRole([...MANAGER_ROLES, ROLES.TECHNICIAN]), workOrderController.deleteAttachment);

export default router;
