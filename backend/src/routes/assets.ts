import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAssetSchema, UpdateAssetSchema, BulkDeleteSchema } from '../validators/asset.validator';
import { assetController } from '../controllers/asset.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets
 *     description: Retrieve all assets (filtered by organization for non-super admins)
 *     tags: [Assets]
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/AssetStatus'
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
 *         name: asset_type
 *         schema:
 *           type: string
 *           enum: [movable, immovable]
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
 *         description: List of assets
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', assetController.getAll);

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create a new asset
 *     description: Create a new asset (manager roles only)
 *     tags: [Assets]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               site_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               asset_tag:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               asset_type:
 *                 type: string
 *                 enum: [movable, immovable]
 *                 default: movable
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               manufacturer:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               model:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               serial_number:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               purchase_date:
 *                 type: string
 *                 format: date
 *               purchase_cost:
 *                 type: string
 *                 maxLength: 50
 *               warranty_expiry:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 maxLength: 50
 *                 default: active
 *               org_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(MANAGER_ROLES), validate(CreateAssetSchema), assetController.create);

/**
 * @swagger
 * /assets/bulk:
 *   post:
 *     summary: Bulk create assets
 *     description: Create multiple assets at once (manager roles only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assets
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                       maxLength: 255
 *                     site_id:
 *                       type: string
 *                       format: uuid
 *                     asset_tag:
 *                       type: string
 *                     asset_type:
 *                       type: string
 *                       enum: [movable, immovable]
 *                     category:
 *                       type: string
 *                     location:
 *                       type: string
 *                     manufacturer:
 *                       type: string
 *                     model:
 *                       type: string
 *                     serial_number:
 *                       type: string
 *               org_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Assets created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk', requireRole(MANAGER_ROLES), assetController.bulkCreate);

/**
 * @swagger
 * /assets/{asset_id}:
 *   get:
 *     summary: Get asset by ID
 *     description: Retrieve a specific asset with all details
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asset_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:asset_id', assetController.getById);

/**
 * @swagger
 * /assets/{asset_id}:
 *   put:
 *     summary: Update asset
 *     description: Update an existing asset (manager roles only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asset_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               site_id:
 *                 type: string
 *                 format: uuid
 *               asset_tag:
 *                 type: string
 *               asset_type:
 *                 type: string
 *                 enum: [movable, immovable]
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               model:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               purchase_date:
 *                 type: string
 *               purchase_cost:
 *                 type: string
 *               warranty_expiry:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:asset_id', requireRole(MANAGER_ROLES), validate(UpdateAssetSchema), assetController.update);

/**
 * @swagger
 * /assets/{asset_id}:
 *   delete:
 *     summary: Delete asset (soft delete)
 *     description: Soft delete an asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asset_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:asset_id', assetController.delete);

/**
 * @swagger
 * /assets/{asset_id}/restore:
 *   post:
 *     summary: Restore deleted asset
 *     description: Restore a soft-deleted asset (manager roles only)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: asset_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:asset_id/restore', requireRole(MANAGER_ROLES), assetController.restore);

/**
 * @swagger
 * /assets/bulk-delete:
 *   post:
 *     summary: Bulk delete assets
 *     description: Soft delete multiple assets (manager roles only)
 *     tags: [Assets]
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
 *         description: Assets deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), assetController.bulkDelete);

export default router;
