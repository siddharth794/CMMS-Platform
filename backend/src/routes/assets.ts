import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateAssetSchema, UpdateAssetSchema, BulkDeleteSchema } from '../validators/asset.validator';
import { assetController } from '../controllers/asset.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', assetController.getAll);
router.post('/', requireRole(MANAGER_ROLES), validate(CreateAssetSchema), assetController.create);
router.post('/bulk', requireRole(MANAGER_ROLES), assetController.bulkCreate);
router.get('/:asset_id', assetController.getById);
router.put('/:asset_id', requireRole(MANAGER_ROLES), validate(UpdateAssetSchema), assetController.update);
router.delete('/:asset_id', assetController.delete);
router.post('/:asset_id/restore', requireRole(MANAGER_ROLES), assetController.restore);
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), assetController.bulkDelete);

export default router;
