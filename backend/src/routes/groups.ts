import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateGroupSchema, UpdateGroupSchema, UpdateGroupMembersSchema, UpdateGroupRolesSchema } from '../validators/group.validator';
import { groupController } from '../controllers/group.controller';
import { ADMIN_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', groupController.getAll);
router.post('/', requireRole(ADMIN_ROLES), validate(CreateGroupSchema), groupController.create);
router.put('/:group_id', requireRole(ADMIN_ROLES), validate(UpdateGroupSchema), groupController.update);
router.delete('/:group_id', requireRole(ADMIN_ROLES), groupController.delete);
router.put('/:group_id/members', requireRole(ADMIN_ROLES), validate(UpdateGroupMembersSchema), groupController.updateMembers);
router.put('/:group_id/roles', requireRole(ADMIN_ROLES), validate(UpdateGroupRolesSchema), groupController.updateRoles);

export default router;
