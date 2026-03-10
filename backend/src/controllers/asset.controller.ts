import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';
import { CreateAssetDTO, UpdateAssetDTO, AssetListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class AssetController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = (userRole === 'super_admin' && req.query.org_id) ? String(req.query.org_id) : req.user!.org_id;
        
        const result = await assetService.getAll(targetOrgId, req.query as unknown as AssetListQuery);
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const asset = await assetService.getById(req.params.asset_id as string, targetOrgId);
        res.json(asset);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const asset = await assetService.create(req.user!.org_id, req.body as CreateAssetDTO, this.getAuditContext(req));
        res.status(201).json(asset);
    }

    bulkCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const assets = await assetService.bulkCreate(req.user!.org_id, req.body.assets || []);
        res.status(201).json(assets);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const asset = await assetService.update(req.params.asset_id as string, targetOrgId, req.body as UpdateAssetDTO, this.getAuditContext(req));
        res.json(asset);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await assetService.delete(req.params.asset_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await assetService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
        res.json(result);
    }
}

export const assetController = new AssetController();
