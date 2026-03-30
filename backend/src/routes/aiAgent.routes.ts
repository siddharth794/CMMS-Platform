import { Router } from 'express';
import { aiAgentController } from '../controllers/aiAgent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /ai-agent/work-orders/smart-create:
 *   post:
 *     summary: Smart work order creation
 *     description: Create a work order using AI interpretation (for voice agents)
 *     tags: [AI Agent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Natural language description of the work order
 *               site_id:
 *                 type: string
 *                 format: uuid
 *               org_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: User creating the request
 *           example:
 *             text: "I need to fix the AC in conference room B. It's not cooling properly and making a strange noise."
 *             site_id: 550e8400-e29b-41d4-a716-446655440000
 *             org_id: 550e8400-e29b-41d4-a716-446655440001
 *             user_id: 550e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       201:
 *         description: Work order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 priority:
 *                   type: string
 *                 status:
 *                   type: string
 *       200:
 *         description: Needs clarification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: needs_clarification
 *                 field:
 *                   type: string
 *                 message:
 *                   type: string
 *                 options:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/work-orders/smart-create', authenticate, aiAgentController.smartCreateWorkOrder);

/**
 * @swagger
 * /ai-agent/work-orders/latest:
 *   get:
 *     summary: Get latest work orders
 *     description: Get recent work orders for AI agent context
 *     tags: [AI Agent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of work orders to return
 *     responses:
 *       200:
 *         description: Latest work orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 work_orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       location:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/work-orders/latest', authenticate, aiAgentController.getLatestWorkOrders);

export default router;
