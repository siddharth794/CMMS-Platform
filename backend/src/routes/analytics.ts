import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/technician-dashboard', analyticsController.getTechnicianDashboard);

export default router;
