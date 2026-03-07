import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrganizationSchema, UpdateOrganizationSchema } from '../validators/organization.validator';
import { organizationController } from '../controllers/organization.controller';

const router = Router();

router.post('/', validate(CreateOrganizationSchema), organizationController.create);

router.use(authenticate);
router.get('/', organizationController.getAll);
router.get('/:org_id', organizationController.getById);
router.put('/:org_id', validate(UpdateOrganizationSchema), organizationController.update);
router.delete('/:org_id', organizationController.delete);

export default router;
