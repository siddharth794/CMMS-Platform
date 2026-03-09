import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateRoleSchema, UpdateRoleSchema, UpdateRoleAccessesSchema } from '../validators/role.validator';
import { roleController } from '../controllers/role.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', roleController.getAll);
router.post('/', requireRole(ADMIN_ROLES), validate(CreateRoleSchema), roleController.create);
router.put('/:role_id', requireRole(ADMIN_ROLES), validate(UpdateRoleSchema), roleController.update);
router.delete('/:role_id', requireRole(ADMIN_ROLES), roleController.delete);
router.put('/:role_id/accesses', requireRole(ADMIN_ROLES), validate(UpdateRoleAccessesSchema), roleController.updateAccesses);

export default router;
