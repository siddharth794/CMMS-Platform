import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';
import { CreateAssetDTO, UpdateAssetDTO, AssetListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';
import { BadRequestError } from '../errors/AppError';
import logger from '../config/logger';

class AssetController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        let targetOrgId: string | null = req.user!.org_id;
        
        // If super admin and they explicitly select "all" (which might come as empty string from frontend)
        if (userRole === 'super_admin') {
            if (req.query.org_id && String(req.query.org_id).trim() !== '') {
                targetOrgId = String(req.query.org_id);
            } else if (req.query.org_id === '' || req.query.org_id === undefined) {
                targetOrgId = null; // null means no org_id filter, so it shows all assets
            }
        }
        
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
        const user = req.user!;
        const effectiveRoles = user.effectiveRoles || (user.Role ? [user.Role] : []);
        const roles = effectiveRoles.map((r: any) => r.name.toLowerCase());
        
        const isSuperAdmin = roles.includes('super_admin') || roles.includes('super admin');
        const isOrgAdmin = roles.includes('org_admin') || roles.includes('org admin');
        const isFacilityManager = roles.includes('facility_manager') || roles.includes('facility manager');

        let targetOrgId = user.org_id;
        
        if (isSuperAdmin && req.body.org_id) {
            targetOrgId = req.body.org_id;
        }

        const dto: CreateAssetDTO = { ...req.body };

        // Force org_id and site_id based on role
        if (isFacilityManager) {
            // Priority: managed_site.id then site_id
            const forcedSiteId = user.managed_site?.id || user.site_id;
            
            logger.info({ 
                forcedSiteId, 
                current_dto_site_id: dto.site_id 
            }, 'Asset creation debug: Facility Manager site assignment');
            
            if (!forcedSiteId && !dto.site_id) {
                logger.warn({ 
                    email: user.email, 
                    roles, 
                    site_id: user.site_id, 
                    has_managed_site: !!user.managed_site 
                }, 'Asset creation failed: Facility Manager has no associated site');
                throw new BadRequestError('Your account is not associated with any site. Please contact your administrator to assign a site before creating assets.');
            }

            dto.site_id = forcedSiteId || dto.site_id;
            dto.org_id = user.org_id;
        } else if (isOrgAdmin) {
            dto.org_id = user.org_id;
        }

        logger.info({ final_site_id: dto.site_id, final_org_id: dto.org_id || targetOrgId }, 'Asset creation debug: Final payload before service');

        const asset = await assetService.create(dto.org_id || targetOrgId, dto, this.getAuditContext(req));
        res.status(201).json(asset);
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
            // Super Admin can specify both
            if (req.body.org_id) targetOrgId = req.body.org_id;
        } else if (isOrgAdmin) {
            // Org Admin is locked to their org, but can specify site
            targetOrgId = user.org_id;
        } else if (isFacilityManager) {
            // Facility Manager is locked to both
            targetOrgId = user.org_id;
            targetSiteId = user.managed_site?.id || user.site_id;
        }

        const assets = await assetService.bulkCreate(targetOrgId, req.body.assets || [], targetSiteId);
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

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await assetService.restore(req.params.asset_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = userRole === 'super_admin' ? null : req.user!.org_id;
        const result = await assetService.bulkDelete(targetOrgId, req.body as BulkDeleteDTO, this.getAuditContext(req));
        res.json(result);
    }
}

export const assetController = new AssetController();
