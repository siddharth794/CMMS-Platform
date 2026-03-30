import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateInventoryItemSchema, UpdateInventoryItemSchema, BulkDeleteSchema, BulkCreateInventorySchema } from '../validators/inventory.validator';
import { inventoryController } from '../controllers/inventory.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     description: Retrieve all inventory items (filtered by organization)
 *     tags: [Inventory]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *         name: low_stock
 *         schema:
 *           type: boolean
 *         description: Filter items with quantity below min_quantity
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
 *         description: List of inventory items
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', inventoryController.getAll);

/**
 * @swagger
 * /inventory/stats:
 *   get:
 *     summary: Get inventory statistics
 *     description: Get overall inventory statistics
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', inventoryController.getStats);

/**
 * @swagger
 * /inventory/categories:
 *   get:
 *     summary: Get inventory categories
 *     description: Get list of all unique inventory categories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of categories
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/categories', inventoryController.getCategories);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create inventory item
 *     description: Create a new inventory item (manager roles only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 nullable: true
 *               sku:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               category:
 *                 type: string
 *                 maxLength: 100
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               min_quantity:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               unit:
 *                 type: string
 *                 maxLength: 50
 *                 default: pcs
 *               unit_cost:
 *                 type: string
 *                 maxLength: 50
 *                 default: 0
 *               storage_location:
 *                 type: string
 *                 maxLength: 255
 *               site_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               org_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(MANAGER_ROLES), validate(CreateInventoryItemSchema), inventoryController.create);

/**
 * @swagger
 * /inventory/bulk:
 *   post:
 *     summary: Bulk create inventory items
 *     description: Create multiple inventory items at once (manager roles only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - category
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     sku:
 *                       type: string
 *                     category:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     min_quantity:
 *                       type: integer
 *                     unit:
 *                       type: string
 *                     unit_cost:
 *                       type: string
 *                     storage_location:
 *                       type: string
 *                     site_id:
 *                       type: string
 *                       format: uuid
 *               org_id:
 *                 type: string
 *                 format: uuid
 *               site_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Inventory items created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk', requireRole(MANAGER_ROLES), validate(BulkCreateInventorySchema), inventoryController.bulkCreate);

/**
 * @swagger
 * /inventory/{item_id}:
 *   get:
 *     summary: Get inventory item by ID
 *     description: Retrieve a specific inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:item_id', inventoryController.getById);

/**
 * @swagger
 * /inventory/{item_id}:
 *   put:
 *     summary: Update inventory item
 *     description: Update an existing inventory item (manager roles only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               category:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               min_quantity:
 *                 type: integer
 *               unit:
 *                 type: string
 *               unit_cost:
 *                 type: string
 *               storage_location:
 *                 type: string
 *               site_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:item_id', requireRole(MANAGER_ROLES), validate(UpdateInventoryItemSchema), inventoryController.update);

/**
 * @swagger
 * /inventory/{item_id}:
 *   delete:
 *     summary: Delete inventory item (soft delete)
 *     description: Soft delete an inventory item (manager roles only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:item_id', requireRole(MANAGER_ROLES), inventoryController.delete);

/**
 * @swagger
 * /inventory/{item_id}/restore:
 *   post:
 *     summary: Restore deleted inventory item
 *     description: Restore a soft-deleted inventory item (manager roles only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:item_id/restore', requireRole(MANAGER_ROLES), inventoryController.restore);

/**
 * @swagger
 * /inventory/bulk-delete:
 *   post:
 *     summary: Bulk delete inventory items
 *     description: Soft delete multiple inventory items (manager roles only)
 *     tags: [Inventory]
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
 *     responses:
 *       200:
 *         description: Inventory items deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), inventoryController.bulkDelete);

/**
 * @swagger
 * /inventory/bulk-restore:
 *   post:
 *     summary: Bulk restore inventory items
 *     description: Restore multiple soft-deleted inventory items (manager roles only)
 *     tags: [Inventory]
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
 *     responses:
 *       200:
 *         description: Inventory items restored successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-restore', requireRole(MANAGER_ROLES), inventoryController.bulkRestore);

export default router;
