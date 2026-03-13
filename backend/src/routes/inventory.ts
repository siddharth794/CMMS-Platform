import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateInventoryItemSchema, UpdateInventoryItemSchema, BulkDeleteSchema, BulkCreateInventorySchema } from '../validators/inventory.validator';
import { inventoryController } from '../controllers/inventory.controller';
import { MANAGER_ROLES } from '../constants/roles';

const router = Router();
router.use(authenticate);

router.get('/', inventoryController.getAll);
router.get('/stats', inventoryController.getStats);
router.get('/categories', inventoryController.getCategories);
router.post('/', requireRole(MANAGER_ROLES), validate(CreateInventoryItemSchema), inventoryController.create);
router.post('/bulk', requireRole(MANAGER_ROLES), validate(BulkCreateInventorySchema), inventoryController.bulkCreate);
router.get('/:item_id', inventoryController.getById);
router.put('/:item_id', requireRole(MANAGER_ROLES), validate(UpdateInventoryItemSchema), inventoryController.update);
router.delete('/:item_id', requireRole(MANAGER_ROLES), inventoryController.delete);
router.post('/:item_id/restore', requireRole(MANAGER_ROLES), inventoryController.restore);
router.post('/bulk-delete', requireRole(MANAGER_ROLES), validate(BulkDeleteSchema), inventoryController.bulkDelete);

export default router;
