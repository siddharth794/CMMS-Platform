import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateGroupSchema, UpdateGroupSchema, UpdateGroupMembersSchema, UpdateGroupRolesSchema } from '../validators/group.validator';
import { groupController } from '../controllers/group.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all user groups
 *     description: Retrieve all user groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', groupController.getAll);

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new user group
 *     description: Create a new user group (admin only)
 *     tags: [Groups]
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
 *               description:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             name: Night Shift Team
 *             description: Team members working night shift
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ADMIN_ROLES), validate(CreateGroupSchema), groupController.create);

/**
 * @swagger
 * /groups/{group_id}:
 *   put:
 *     summary: Update user group
 *     description: Update group details (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
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
 *         description: Group updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:group_id', requireRole(ADMIN_ROLES), validate(UpdateGroupSchema), groupController.update);

/**
 * @swagger
 * /groups/{group_id}:
 *   delete:
 *     summary: Delete user group
 *     description: Delete a user group (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:group_id', requireRole(ADMIN_ROLES), groupController.delete);

/**
 * @swagger
 * /groups/{group_id}/members:
 *   put:
 *     summary: Update group members
 *     description: Set the members of a group (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs
 *           example:
 *             user_ids:
 *               - 550e8400-e29b-41d4-a716-446655440000
 *               - 550e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Group members updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:group_id/members', requireRole(ADMIN_ROLES), validate(UpdateGroupMembersSchema), groupController.updateMembers);

/**
 * @swagger
 * /groups/{group_id}/roles:
 *   put:
 *     summary: Update group roles
 *     description: Set the roles assigned to a group (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_ids
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of role IDs
 *           example:
 *             role_ids: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Group roles updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:group_id/roles', requireRole(ADMIN_ROLES), validate(UpdateGroupRolesSchema), groupController.updateRoles);

export default router;
