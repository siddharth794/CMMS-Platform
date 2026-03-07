import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';
import { CreateAssetDTO, UpdateAssetDTO, AssetListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class AssetController {
    private getAuditContext(req: Request): AuditContext {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await assetService.getAll(req.user!.org_id, req.query as unknown as AssetListQuery);
            res.json(result);
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const asset = await assetService.getById(req.params.asset_id as string, req.user!.org_id);
            res.json(asset);
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const asset = await assetService.create(req.user!.org_id, req.body as CreateAssetDTO, this.getAuditContext(req));
            res.status(201).json(asset);
        } catch (err) { next(err); }
    }

    async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const assets = await assetService.bulkCreate(req.user!.org_id, req.body.assets || []);
            res.status(201).json(assets);
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const asset = await assetService.update(req.params.asset_id as string, req.user!.org_id, req.body as UpdateAssetDTO, this.getAuditContext(req));
            res.json(asset);
        } catch (err) { next(err); }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await assetService.delete(req.params.asset_id as string, req.user!.org_id, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }

    async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await assetService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
            res.json(result);
        } catch (err) { next(err); }
    }
}

export const assetController = new AssetController();
