import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateRoleSchema, UpdateRoleSchema, UpdateRoleAccessesSchema } from '../validators/role.validator';
import { roleController } from '../controllers/role.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', roleController.getAll);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with permissions (admin only)
 *     tags: [Roles]
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
 *                 maxLength: 100
 *                 description: Role name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             name: custom_role
 *             description: Custom role with limited permissions
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ADMIN_ROLES), validate(CreateRoleSchema), roleController.create);

/**
 * @swagger
 * /roles/{role_id}:
 *   put:
 *     summary: Update role
 *     description: Update role name and description (admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:role_id', requireRole(ADMIN_ROLES), validate(UpdateRoleSchema), roleController.update);

/**
 * @swagger
 * /roles/{role_id}:
 *   delete:
 *     summary: Delete role
 *     description: Delete a role (admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:role_id', requireRole(ADMIN_ROLES), roleController.delete);

/**
 * @swagger
 * /roles/{role_id}/accesses:
 *   put:
 *     summary: Update role accesses
 *     description: Set the permissions/accesses for a role (admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_ids
 *             properties:
 *               access_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of access/permission IDs
 *           example:
 *             access_ids:
 *               - 550e8400-e29b-41d4-a716-446655440000
 *               - 550e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Role accesses updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:role_id/accesses', requireRole(ADMIN_ROLES), validate(UpdateRoleAccessesSchema), roleController.updateAccesses);

export default router;
