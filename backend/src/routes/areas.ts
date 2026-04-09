import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  getAreaQrCode,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getExecutions,
  verifyQr,
  completeTask
} from '../controllers/area.controller';
import {
  createFloorSchema,
  updateFloorSchema,
  createAreaSchema,
  updateAreaSchema,
  createAreaChecklistScheduleSchema,
  updateAreaChecklistScheduleSchema,
  verifyQrSchema
} from '../validators/area.validator';

const router = Router();

router.use(authenticate);

// --- Floors ---
router.get('/sites/:siteId/floors', requirePermission('site:view'), getFloors);
router.post('/floors', requirePermission('site:manage'), validate(createFloorSchema), createFloor);
router.put('/floors/:id', requirePermission('site:manage'), validate(updateFloorSchema), updateFloor);
router.delete('/floors/:id', requirePermission('site:manage'), deleteFloor);

// --- Areas ---
router.get('/floors/:floorId/areas', requirePermission('site:view'), getAreas);
router.get('/areas/:id', requirePermission('site:view'), getAreaById);
router.post('/areas', requirePermission('site:manage'), validate(createAreaSchema), createArea);
router.put('/areas/:id', requirePermission('site:manage'), validate(updateAreaSchema), updateArea);
router.delete('/areas/:id', requirePermission('site:manage'), deleteArea);
router.get('/areas/:id/qr-code', requirePermission('site:manage'), getAreaQrCode);

// --- Area Schedules ---
router.get('/areas/:areaId/schedules', requirePermission('site:view'), getSchedules);
router.post('/areas/:areaId/schedules', requirePermission('site:manage'), validate(createAreaChecklistScheduleSchema), createSchedule);
router.put('/area-schedules/:id', requirePermission('site:manage'), validate(updateAreaChecklistScheduleSchema), updateSchedule);
router.delete('/area-schedules/:id', requirePermission('site:manage'), deleteSchedule);

// --- Area Executions (Tasks) ---
router.get('/area-executions', requirePermission('site:view'), getExecutions);
router.post('/area-executions/:id/verify-qr', requirePermission('site:manage'), validate(verifyQrSchema), verifyQr);
router.patch('/area-executions/:id/complete', requirePermission('site:manage'), completeTask);

export default router;