import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateOrganizationSchema } from '../validators/organization.validator';
import { organizationController } from '../controllers/organization.controller';

const router = Router();

router.post('/', validate(CreateOrganizationSchema), organizationController.create);

router.use(authenticate);
router.get('/', organizationController.getAll);
router.get('/:org_id', organizationController.getById);

export default router;
