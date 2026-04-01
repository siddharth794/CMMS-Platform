import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    createChecklist,
    getChecklists,
    getChecklistById,
    updateChecklist,
    deleteChecklist,
    restoreChecklist,
    bulkDeleteChecklists,
    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem
} from '../controllers/checklist.controller';
import {
    createChecklistSchema,
    updateChecklistSchema,
    addChecklistItemSchema,
    updateChecklistItemSchema,
    toggleChecklistItemSchema
} from '../validators/checklist.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Checklist Master Routes
router.get('/', getChecklists);
router.get('/:id', getChecklistById);
router.post('/', requirePermission('checklist:manage'), validate(createChecklistSchema), createChecklist);
router.post('/bulk-delete', requirePermission('checklist:manage'), bulkDeleteChecklists);
router.put('/:id', requirePermission('checklist:manage'), validate(updateChecklistSchema), updateChecklist);
router.delete('/:id', requirePermission('checklist:manage'), deleteChecklist);
router.post('/:id/restore', requirePermission('checklist:manage'), restoreChecklist);

// Checklist Item Routes
router.post('/:id/items', requirePermission('checklist:manage'), validate(addChecklistItemSchema), addChecklistItem);
router.put('/:id/items/:itemId', requirePermission('checklist:manage'), validate(updateChecklistItemSchema), updateChecklistItem);
router.delete('/:id/items/:itemId', requirePermission('checklist:manage'), deleteChecklistItem);

// Technician Execution Route
router.patch('/:id/items/:itemId/toggle', requirePermission('checklist:execute'), validate(toggleChecklistItemSchema), toggleChecklistItem);

export default router;
