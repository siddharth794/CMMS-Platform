import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO, InventoryListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class InventoryController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        let targetOrgId: string | null = req.user!.org_id;

        if (userRole === 'super_admin') {
            if (req.query.org_id && String(req.query.org_id).trim() !== '') {
                targetOrgId = String(req.query.org_id);
            } else if (req.query.org_id === '' || req.query.org_id === undefined) {
                targetOrgId = null;
            }
        }
        
        const query = req.query as unknown as InventoryListQuery;
        
        // Scope by site for Facility Managers
        if (userRole === 'facility_manager' && req.user!.site_id) {
            query.site_id = req.user!.site_id;
        }

        const result = await inventoryService.getAll(targetOrgId, query);
        res.json(result);
    }

    getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        let targetOrgId: string | null = req.user!.org_id;

        if (userRole === 'super_admin') {
            if (req.query.org_id && String(req.query.org_id).trim() !== '') {
                targetOrgId = String(req.query.org_id);
            } else if (req.query.org_id === '' || req.query.org_id === undefined) {
                targetOrgId = null;
            }
        }
        
        const query: any = { ...req.query };
        if (userRole === 'facility_manager' && req.user!.site_id) {
            query.site_id = req.user!.site_id;
        }

        const stats = await inventoryService.getStats(targetOrgId, query);
        res.json(stats);
    }

    getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        let targetOrgId: string | null = req.user!.org_id;

        if (userRole === 'super_admin') {
            if (req.query.org_id && String(req.query.org_id).trim() !== '') {
                targetOrgId = String(req.query.org_id);
            } else if (req.query.org_id === '' || req.query.org_id === undefined) {
                targetOrgId = null;
            }
        }
        
        const siteId = (userRole === 'facility_manager' && req.user!.site_id) ? req.user!.site_id : (req.query.site_id as string);

        const result = await inventoryService.getCategories(targetOrgId, siteId);
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const item = await inventoryService.getById(req.params.item_id as string, targetOrgId);
        res.json(item);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = (userRole === 'super_admin' && req.body.org_id) ? req.body.org_id : req.user!.org_id;
        
        // Auto-assign site for Facility Managers if missing
        if (userRole === 'facility_manager' && !req.body.site_id) {
            req.body.site_id = req.user!.site_id;
        }

        const item = await inventoryService.create(targetOrgId, req.body as CreateInventoryItemDTO, this.getAuditContext(req));
        res.status(201).json(item);
    }

    bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const user = req.user!;
        const effectiveRoles = user.effectiveRoles || (user.Role ? [user.Role] : []);
        const roles = effectiveRoles.map((r: any) => r.name.toLowerCase());
        
        const isSuperAdmin = roles.includes('super_admin') || roles.includes('super admin');
        const isOrgAdmin = roles.includes('org_admin') || roles.includes('org admin');
        const isFacilityManager = roles.includes('facility_manager') || roles.includes('facility manager');

        let targetOrgId = user.org_id;
        let targetSiteId = req.body.site_id;

        if (isSuperAdmin) {
            if (req.body.org_id) targetOrgId = req.body.org_id;
        } else if (isOrgAdmin) {
            targetOrgId = user.org_id;
        } else if (isFacilityManager) {
            targetOrgId = user.org_id;
            targetSiteId = user.managed_site?.id || user.site_id;
        }

        const result = await inventoryService.bulkCreate(targetOrgId, req.body.items || [], this.getAuditContext(req), targetSiteId);
        res.status(201).json(result);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const item = await inventoryService.update(req.params.item_id as string, targetOrgId, req.body as UpdateInventoryItemDTO);
        res.json(item);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await inventoryService.delete(req.params.item_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await inventoryService.restore(req.params.item_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await inventoryService.bulkDelete(targetOrgId, req.body as BulkDeleteDTO, this.getAuditContext(req));
        res.json(result);
    }

    bulkRestore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await inventoryService.bulkRestore(targetOrgId, req.body.ids, this.getAuditContext(req));
        res.json(result);
    }
}

export const inventoryController = new InventoryController();
