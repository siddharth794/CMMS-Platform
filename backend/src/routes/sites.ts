import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { 
    CreateSiteSchema, 
    UpdateSiteSchema, 
    BulkDeleteSchema, 
    AssignManagerSchema, 
    AssignTechnicianSchema 
} from '../validators/site.validator';
import { siteController } from '../controllers/site.controller';
import { ADMIN_ROLES, MANAGER_ROLES } from '../constants/roles';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /sites:
 *   get:
 *     summary: Get all sites
 *     description: Retrieve all sites (filtered by organization for non-super admins)
 *     tags: [Sites]
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
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of sites
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', siteController.getAll);

/**
 * @swagger
 * /sites/{site_id}:
 *   get:
 *     summary: Get site by ID
 *     description: Retrieve a specific site with details
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:site_id', siteController.getById);

/**
 * @swagger
 * /sites:
 *   post:
 *     summary: Create a new site
 *     description: Create a new site within an organization (admin only)
 *     tags: [Sites]
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
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *                 maxLength: 100
 *               state:
 *                 type: string
 *                 maxLength: 100
 *               zip_code:
 *                 type: string
 *                 maxLength: 20
 *               country:
 *                 type: string
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               org_id:
 *                 type: string
 *                 format: uuid
 *           example:
 *             name: Main Facility
 *             address: 456 Industrial Park
 *             city: Chicago
 *             state: IL
 *             zip_code: "60601"
 *             country: USA
 *     responses:
 *       201:
 *         description: Site created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(ADMIN_ROLES), validate(CreateSiteSchema), siteController.create);

/**
 * @swagger
 * /sites/{site_id}:
 *   put:
 *     summary: Update site
 *     description: Update an existing site (admin only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip_code:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:site_id', requireRole(ADMIN_ROLES), validate(UpdateSiteSchema), siteController.update);

/**
 * @swagger
 * /sites/{site_id}:
 *   delete:
 *     summary: Delete site (soft delete)
 *     description: Soft delete a site (admin only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:site_id', requireRole(ADMIN_ROLES), siteController.delete);

/**
 * @swagger
 * /sites/{site_id}/restore:
 *   post:
 *     summary: Restore deleted site
 *     description: Restore a soft-deleted site (admin only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:site_id/restore', requireRole(ADMIN_ROLES), siteController.restore);

/**
 * @swagger
 * /sites/bulk-delete:
 *   post:
 *     summary: Bulk delete sites
 *     description: Soft delete multiple sites (admin only)
 *     tags: [Sites]
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
 *         description: Sites deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(ADMIN_ROLES), validate(BulkDeleteSchema), siteController.bulkDelete);

/**
 * @swagger
 * /sites/{site_id}/manager:
 *   put:
 *     summary: Assign site manager
 *     description: Assign or change the manager of a site (admin only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: User ID of the manager (null to remove)
 *           example:
 *             manager_id: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Manager assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:site_id/manager', requireRole(ADMIN_ROLES), validate(AssignManagerSchema), siteController.assignManager);

/**
 * @swagger
 * /sites/{site_id}/technicians/{user_id}:
 *   put:
 *     summary: Assign technician to site
 *     description: Add a technician to a site (manager roles only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (technician)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Technician assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:site_id/technicians/:user_id', requireRole(MANAGER_ROLES), validate(AssignTechnicianSchema), siteController.assignTechnician);

/**
 * @swagger
 * /sites/{site_id}/technicians/{user_id}:
 *   delete:
 *     summary: Remove technician from site
 *     description: Remove a technician from a site (manager roles only)
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: site_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (technician)
 *     responses:
 *       200:
 *         description: Technician removed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:site_id/technicians/:user_id', requireRole(MANAGER_ROLES), siteController.removeTechnician);

export default router;
