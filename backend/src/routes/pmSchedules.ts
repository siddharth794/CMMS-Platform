import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreatePMScheduleSchema, UpdatePMScheduleSchema } from '../validators/pmSchedule.validator';
import { pmScheduleController } from '../controllers/pmSchedule.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /pm-schedules:
 *   get:
 *     summary: Get all PM schedules
 *     description: Retrieve all preventive maintenance schedules
 *     tags: [PM Schedules]
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
 *         name: is_paused
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
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
 *         description: List of PM schedules
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', pmScheduleController.getAll);

/**
 * @swagger
 * /pm-schedules:
 *   post:
 *     summary: Create a new PM schedule
 *     description: Create a new preventive maintenance schedule (manager roles only)
 *     tags: [PM Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - asset_id
 *               - name
 *               - triggers
 *               - template
 *             properties:
 *               org_id:
 *                 type: string
 *                 format: uuid
 *               site_id:
 *                 type: string
 *                 format: uuid
 *               asset_id:
 *                 type: string
 *                 format: uuid
 *                 description: Asset to maintain
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               schedule_logic:
 *                 type: string
 *                 enum: [FIXED, FLOATING]
 *                 default: FIXED
 *               is_paused:
 *                 type: boolean
 *                 default: false
 *               triggers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     trigger_type:
 *                       type: string
 *                       enum: [TIME, METER]
 *                       default: TIME
 *                     cron_expression:
 *                       type: string
 *                       description: Cron expression for TIME triggers
 *                     meter_interval:
 *                       type: integer
 *                       description: Interval for METER triggers
 *                     lead_time_days:
 *                       type: integer
 *                       default: 7
 *               template:
 *                 type: object
 *                 properties:
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high, critical]
 *                     default: medium
 *                   estimated_hours:
 *                     type: integer
 *                   assignee_id:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventory_item_id:
 *                       type: string
 *                       format: uuid
 *                     quantity_required:
 *                       type: integer
 *           example:
 *             asset_id: 550e8400-e29b-41d4-a716-446655440000
 *             name: Monthly HVAC Check
 *             description: Regular monthly maintenance
 *             schedule_logic: FIXED
 *             triggers:
 *               - trigger_type: TIME
 *                 cron_expression: "0 9 1 * *"
 *                 lead_time_days: 7
 *             template:
 *               priority: medium
 *               estimated_hours: 2
 *             tasks:
 *               - description: Replace air filters
 *               - description: Check refrigerant levels
 *     responses:
 *       201:
 *         description: PM schedule created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', requireRole(MANAGER_ROLES), validate(CreatePMScheduleSchema), pmScheduleController.create);

/**
 * @swagger
 * /pm-schedules/bulk-delete:
 *   post:
 *     summary: Bulk delete PM schedules
 *     description: Delete multiple PM schedules (manager roles only)
 *     tags: [PM Schedules]
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
 *         description: PM schedules deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', requireRole(MANAGER_ROLES), pmScheduleController.bulkDelete);

/**
 * @swagger
 * /pm-schedules/{pm_id}:
 *   get:
 *     summary: Get PM schedule by ID
 *     description: Retrieve a specific PM schedule with all details
 *     tags: [PM Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: PM schedule ID
 *     responses:
 *       200:
 *         description: PM schedule details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:pm_id', pmScheduleController.getById);

/**
 * @swagger
 * /pm-schedules/{pm_id}:
 *   put:
 *     summary: Update PM schedule
 *     description: Update an existing PM schedule (manager roles only)
 *     tags: [PM Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: PM schedule ID
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
 *               schedule_logic:
 *                 type: string
 *                 enum: [FIXED, FLOATING]
 *               is_paused:
 *                 type: boolean
 *               triggers:
 *                 type: array
 *               template:
 *                 type: object
 *               tasks:
 *                 type: array
 *               parts:
 *                 type: array
 *     responses:
 *       200:
 *         description: PM schedule updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:pm_id', requireRole(MANAGER_ROLES), validate(UpdatePMScheduleSchema), pmScheduleController.update);

/**
 * @swagger
 * /pm-schedules/{pm_id}:
 *   delete:
 *     summary: Delete PM schedule (soft delete)
 *     description: Soft delete a PM schedule (manager roles only)
 *     tags: [PM Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: PM schedule ID
 *     responses:
 *       200:
 *         description: PM schedule deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:pm_id', requireRole(MANAGER_ROLES), pmScheduleController.delete);

/**
 * @swagger
 * /pm-schedules/{pm_id}/restore:
 *   post:
 *     summary: Restore deleted PM schedule
 *     description: Restore a soft-deleted PM schedule (manager roles only)
 *     tags: [PM Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pm_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: PM schedule ID
 *     responses:
 *       200:
 *         description: PM schedule restored successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:pm_id/restore', requireRole(MANAGER_ROLES), pmScheduleController.restore);

export default router;
