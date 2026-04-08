import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getFloors,
  createFloor,
  updateFloor,
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  getAreaQrCode,
  getSchedules,
  createSchedule,
  updateSchedule,
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
router.get('/sites/:siteId/floors', requirePermission('area:view'), getFloors);
router.post('/floors', requirePermission('area:manage'), validate(createFloorSchema), createFloor);
router.put('/floors/:id', requirePermission('area:manage'), validate(updateFloorSchema), updateFloor);

// --- Areas ---
router.get('/floors/:floorId/areas', requirePermission('area:view'), getAreas);
router.get('/areas/:id', requirePermission('area:view'), getAreaById);
router.post('/areas', requirePermission('area:manage'), validate(createAreaSchema), createArea);
router.put('/areas/:id', requirePermission('area:manage'), validate(updateAreaSchema), updateArea);
router.get('/areas/:id/qr-code', requirePermission('area:manage'), getAreaQrCode);

// --- Area Schedules ---
router.get('/areas/:areaId/schedules', requirePermission('area:view'), getSchedules);
router.post('/areas/:areaId/schedules', requirePermission('area:manage'), validate(createAreaChecklistScheduleSchema), createSchedule);
router.put('/area-schedules/:id', requirePermission('area:manage'), validate(updateAreaChecklistScheduleSchema), updateSchedule);

// --- Area Executions (Tasks) ---
router.get('/area-executions', requirePermission('area:view'), getExecutions);
router.post('/area-executions/:id/verify-qr', requirePermission('area_tasks:execute'), validate(verifyQrSchema), verifyQr);
router.patch('/area-executions/:id/complete', requirePermission('area_tasks:execute'), completeTask);

export default router;