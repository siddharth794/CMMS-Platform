import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateUserSchema, UpdateUserSchema, BulkDeleteSchema } from '../validators/user.validator';
import { userController } from '../controllers/user.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', userController.getAll);
router.post('/', requireRole(ADMIN_ROLES), validate(CreateUserSchema), userController.create);

router.put('/me', userController.updateProfile);
router.put('/me/password', userController.updatePassword);

router.get('/:user_id', userController.getById);

router.put('/:user_id', requireRole(ADMIN_ROLES), validate(UpdateUserSchema), userController.update);
router.delete('/:user_id', requireRole(ADMIN_ROLES), userController.delete);
router.post('/:user_id/restore', requireRole(ADMIN_ROLES), userController.restore);
router.post('/bulk-delete', requireRole(ADMIN_ROLES), validate(BulkDeleteSchema), userController.bulkDelete);


router.put('/:user_id/roles', requireRole(ADMIN_ROLES), userController.updateRoles);

export default router;

