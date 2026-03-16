import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreatePMScheduleSchema, UpdatePMScheduleSchema } from '../validators/pmSchedule.validator';
import { pmScheduleController } from '../controllers/pmSchedule.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', pmScheduleController.getAll);
router.post('/', requireRole(MANAGER_ROLES), validate(CreatePMScheduleSchema), pmScheduleController.create);
router.post('/bulk-delete', requireRole(MANAGER_ROLES), pmScheduleController.bulkDelete);
router.get('/:pm_id', pmScheduleController.getById);
router.put('/:pm_id', requireRole(MANAGER_ROLES), validate(UpdatePMScheduleSchema), pmScheduleController.update);
router.delete('/:pm_id', requireRole(MANAGER_ROLES), pmScheduleController.delete);
router.post('/:pm_id/restore', requireRole(MANAGER_ROLES), pmScheduleController.restore);

export default router;
