import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateUserSchema, UpdateUserSchema, BulkDeleteSchema } from '../validators/user.validator';
import { userController } from '../controllers/user.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users (filtered by organization for non-super admins)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: integer
 *         description: Filter by role ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by organization ID (super admin only)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', userController.getAll);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role_id
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password (min 6 characters)
 *               role_id:
 *                 type: integer
 *                 description: Role ID to assign
 *               username:
 *                 type: string
 *                 maxLength: 100
 *               first_name:
 *                 type: string
 *                 maxLength: 100
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               org_id:
 *                 type: string
 *                 format: uuid
 *               site_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *           example:
 *             email: newuser@example.com
 *             password: password123
 *             role_id: 2
 *             username: newuser
 *             first_name: New
 *             last_name: User
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ADMIN_ROLES), validate(CreateUserSchema), userController.create);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's own profile (except password)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               site_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/me', userController.updateProfile);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Update current user password
 *     description: Update the authenticated user's own password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Current password
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/me/password', userController.updatePassword);

/**
 * @swagger
 * /users/{user_id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:user_id', userController.getById);

/**
 * @swagger
 * /users/{user_id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user's information (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role_id:
 *                 type: integer
 *               username:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               site_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:user_id', requireRole(ADMIN_ROLES), validate(UpdateUserSchema), userController.update);

/**
 * @swagger
 * /users/{user_id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     description: Soft delete a user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:user_id', requireRole(ADMIN_ROLES), userController.delete);

/**
 * @swagger
 * /users/{user_id}/restore:
 *   post:
 *     summary: Restore deleted user
 *     description: Restore a soft-deleted user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:user_id/restore', requireRole(ADMIN_ROLES), userController.restore);

/**
 * @swagger
 * /users/bulk-delete:
 *   post:
 *     summary: Bulk delete users
 *     description: Soft delete multiple users at once (admin only)
 *     tags: [Users]
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
 *                 description: Array of user IDs to delete
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Skip validation checks
 *           example:
 *             ids:
 *               - 550e8400-e29b-41d4-a716-446655440000
 *               - 550e8400-e29b-41d4-a716-446655440001
 *             force: false
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(ADMIN_ROLES), validate(BulkDeleteSchema), userController.bulkDelete);

/**
 * @swagger
 * /users/{user_id}/roles:
 *   put:
 *     summary: Update user roles
 *     description: Assign new roles to a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of role IDs
 *           example:
 *             roles: [1, 2, 3]
 *     responses:
 *       200:
 *         description: User roles updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:user_id/roles', requireRole(ADMIN_ROLES), userController.updateRoles);

export default router;
