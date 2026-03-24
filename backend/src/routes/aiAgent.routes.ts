import { Router } from 'express';
import { aiAgentController } from '../controllers/aiAgent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Endpoint for LiveKit Voice Agent or other agents to perform Smart Creation
router.post('/work-orders/smart-create', authenticate, aiAgentController.smartCreateWorkOrder);

// Endpoint for AI Agent to fetch the latest work orders by site and location
router.get('/work-orders/latest', authenticate, aiAgentController.getLatestWorkOrders);

export default router;
