import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO, InventoryListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class InventoryController {
    private getAuditContext(req: Request): AuditContext {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await inventoryService.getAll(req.user!.org_id, req.query as unknown as InventoryListQuery);
            res.json(result);
        } catch (err) { next(err); }
    }

    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await inventoryService.getStats(req.user!.org_id);
            res.json(stats);
        } catch (err) { next(err); }
    }

    async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await inventoryService.getCategories(req.user!.org_id);
            res.json(result);
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const item = await inventoryService.getById(req.params.item_id as string, req.user!.org_id);
            res.json(item);
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const item = await inventoryService.create(req.user!.org_id, req.body as CreateInventoryItemDTO, this.getAuditContext(req));
            res.status(201).json(item);
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const item = await inventoryService.update(req.params.item_id as string, req.user!.org_id, req.body as UpdateInventoryItemDTO);
            res.json(item);
        } catch (err) { next(err); }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await inventoryService.delete(req.params.item_id as string, req.user!.org_id, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }

    async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await inventoryService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }
}

export const inventoryController = new InventoryController();
