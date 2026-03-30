import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAccessSchema, UpdateAccessSchema } from '../validators/access.validator';
import { accessController } from '../controllers/access.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /accesses:
 *   get:
 *     summary: Get all accesses/permissions
 *     description: Retrieve all available accesses/permissions
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accesses
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', accessController.getAll);

/**
 * @swagger
 * /accesses:
 *   post:
 *     summary: Create a new access/permission
 *     description: Create a new access/permission entry (admin only)
 *     tags: [Accesses]
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
 *                 description: Access name (e.g., "users:read")
 *               description:
 *                 type: string
 *               module:
 *                 type: string
 *                 description: Module this access belongs to
 *           example:
 *             name: work_orders:assign
 *             description: Ability to assign work orders
 *             module: work_orders
 *     responses:
 *       201:
 *         description: Access created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ADMIN_ROLES), validate(CreateAccessSchema), accessController.create);

/**
 * @swagger
 * /accesses/{access_id}:
 *   put:
 *     summary: Update access/permission
 *     description: Update an existing access entry (admin only)
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: access_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Access ID
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
 *               module:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:access_id', requireRole(ADMIN_ROLES), validate(UpdateAccessSchema), accessController.update);

/**
 * @swagger
 * /accesses/{access_id}:
 *   delete:
 *     summary: Delete access/permission
 *     description: Delete an access entry (admin only)
 *     tags: [Accesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: access_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Access ID
 *     responses:
 *       200:
 *         description: Access deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:access_id', requireRole(ADMIN_ROLES), accessController.delete);

export default router;
