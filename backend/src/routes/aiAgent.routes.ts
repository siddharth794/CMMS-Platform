import { Router } from 'express';
import { aiAgentController } from '../controllers/aiAgent.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Endpoint for LiveKit Voice Agent or other agents to perform Smart Creation
router.post('/work-orders/smart-create', authenticate, aiAgentController.smartCreateWorkOrder);

export default router;
