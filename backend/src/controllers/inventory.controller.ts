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
        const targetOrgId = (userRole === 'super_admin' && req.query.org_id) ? String(req.query.org_id) : req.user!.org_id;
        
        const result = await inventoryService.getAll(targetOrgId, req.query as unknown as InventoryListQuery);
        res.json(result);
    }

    getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const stats = await inventoryService.getStats(req.user!.org_id);
        res.json(stats);
    }

    getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await inventoryService.getCategories(req.user!.org_id);
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const item = await inventoryService.getById(req.params.item_id as string, req.user!.org_id);
        res.json(item);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const item = await inventoryService.create(req.user!.org_id, req.body as CreateInventoryItemDTO, this.getAuditContext(req));
        res.status(201).json(item);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const item = await inventoryService.update(req.params.item_id as string, req.user!.org_id, req.body as UpdateInventoryItemDTO);
        res.json(item);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await inventoryService.delete(req.params.item_id as string, req.user!.org_id, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await inventoryService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
        res.json(result);
    }
}

export const inventoryController = new InventoryController();
