import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { 
    CreateSiteSchema, 
    UpdateSiteSchema, 
    BulkDeleteSchema, 
    AssignManagerSchema, 
    AssignTechnicianSchema 
} from '../validators/site.validator';
import { siteController } from '../controllers/site.controller';
import { ADMIN_ROLES, MANAGER_ROLES } from '../constants/roles';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List and get by ID are available to all authenticated users
router.get('/', siteController.getAll);
router.get('/:site_id', siteController.getById);

// Create, Update, Delete require ADMIN_ROLES
router.post('/', requireRole(ADMIN_ROLES), validate(CreateSiteSchema), siteController.create);
router.put('/:site_id', requireRole(ADMIN_ROLES), validate(UpdateSiteSchema), siteController.update);
router.delete('/:site_id', requireRole(ADMIN_ROLES), siteController.delete);
router.post('/bulk-delete', requireRole(ADMIN_ROLES), validate(BulkDeleteSchema), siteController.bulkDelete);

// Assign Manager requires ADMIN_ROLES
router.put('/:site_id/manager', requireRole(ADMIN_ROLES), validate(AssignManagerSchema), siteController.assignManager);

// Assign/Remove Technician requires MANAGER_ROLES
router.put('/:site_id/technicians/:user_id', requireRole(MANAGER_ROLES), validate(AssignTechnicianSchema), siteController.assignTechnician);
router.delete('/:site_id/technicians/:user_id', requireRole(MANAGER_ROLES), siteController.removeTechnician);

export default router;
