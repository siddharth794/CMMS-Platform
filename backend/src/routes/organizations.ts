import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '../validators/organization.validator';
import { organizationController } from '../controllers/organization.controller';

const router = Router();

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create organization
 *     description: Create a new organization (public endpoint)
 *     tags: [Organizations]
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
 *                 description: Organization name
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 nullable: true
 *               address:
 *                 type: string
 *                 maxLength: 1000
 *                 nullable: true
 *               owner_name:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               website_url:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *                 default: true
 *           example:
 *             name: Acme Corporation
 *             description: Manufacturing company
 *             address: 123 Main St
 *             email: contact@acme.com
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', validate(CreateOrganizationSchema), organizationController.create);

router.use(authenticate);

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get all organizations
 *     description: Retrieve all organizations (super admin sees all)
 *     tags: [Organizations]
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of organizations
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', organizationController.getAll);

/**
 * @swagger
 * /organizations/{org_id}:
 *   get:
 *     summary: Get organization by ID
 *     description: Retrieve a specific organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:org_id', organizationController.getById);

/**
 * @swagger
 * /organizations/{org_id}:
 *   put:
 *     summary: Update organization
 *     description: Update an existing organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               owner_name:
 *                 type: string
 *               website_url:
 *                 type: string
 *                 format: uri
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:org_id', validate(UpdateOrganizationSchema), organizationController.update);

/**
 * @swagger
 * /organizations/{org_id}:
 *   delete:
 *     summary: Delete organization (soft delete)
 *     description: Soft delete an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:org_id', organizationController.delete);

export default router;
