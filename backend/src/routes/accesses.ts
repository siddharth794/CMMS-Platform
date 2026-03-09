import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAccessSchema, UpdateAccessSchema } from '../validators/access.validator';
import { accessController } from '../controllers/access.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', accessController.getAll);
router.post('/', requireRole(ADMIN_ROLES), validate(CreateAccessSchema), accessController.create);
router.put('/:access_id', requireRole(ADMIN_ROLES), validate(UpdateAccessSchema), accessController.update);
router.delete('/:access_id', requireRole(ADMIN_ROLES), accessController.delete);

export default router;
