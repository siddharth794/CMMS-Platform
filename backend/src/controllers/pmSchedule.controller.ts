import { Request, Response, NextFunction } from 'express';
import { pmScheduleService } from '../services/pmSchedule.service';
import { CreatePMScheduleDTO, UpdatePMScheduleDTO } from '../types/dto';
import { AuditContext } from '../types/common.dto';

class PMScheduleController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { skip = 0, limit = 100, asset_id, search, record_status, org_id, site_id } = req.query;
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        
        // Scope by organization
        let targetOrgId: string | null = req.user!.org_id;
        if (roleName === 'super_admin') {
            targetOrgId = org_id ? String(org_id) : null;
        }
        
        // Scope by site
        let targetSiteId = site_id as string | undefined;
        if (roleName === 'facility_manager') {
            targetSiteId = req.user!.managed_site?.id || req.user!.site_id || '00000000-0000-0000-0000-000000000000';
        }

        const result = await pmScheduleService.getAll(targetOrgId, {
            asset_id: asset_id as string | undefined,
            site_id: targetSiteId,
            skip: Number(skip),
            limit: Number(limit),
            search: search as string | undefined,
            record_status: record_status as string | undefined
        });
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const targetSiteId = roleName === 'facility_manager' ? (req.user!.managed_site?.id || req.user!.site_id || undefined) : undefined;
        const pm = await pmScheduleService.getById(req.params.pm_id as string, targetOrgId, targetSiteId);
        res.json(pm);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = (roleName === 'super_admin' && req.body.org_id) ? req.body.org_id : req.user!.org_id;
        
        // Auto-assign site if missing (using user's site for FM, or inferring from asset for others)
        if (!req.body.site_id) {
            if (roleName === 'facility_manager') {
                req.body.site_id = req.user!.managed_site?.id || req.user!.site_id;
            } else if (req.body.asset_id) {
                // We'll let the service handle site inference from asset if it's still missing
            }
        }

        const pm = await pmScheduleService.create(targetOrgId, req.body as CreatePMScheduleDTO, this.getAuditContext(req));
        res.status(201).json(pm);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const targetSiteId = roleName === 'facility_manager' ? (req.user!.managed_site?.id || req.user!.site_id || undefined) : undefined;
        const pm = await pmScheduleService.update(req.params.pm_id as string, targetOrgId, req.body as UpdatePMScheduleDTO, targetSiteId);
        res.json(pm);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const targetSiteId = roleName === 'facility_manager' ? (req.user!.managed_site?.id || req.user!.site_id || undefined) : undefined;
        const result = await pmScheduleService.delete(req.params.pm_id as string, targetOrgId, this.getAuditContext(req), targetSiteId);
        res.json(result);
    }

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const targetSiteId = roleName === 'facility_manager' ? (req.user!.managed_site?.id || req.user!.site_id || undefined) : undefined;
        const result = await pmScheduleService.restore(req.params.pm_id as string, targetOrgId, this.getAuditContext(req), targetSiteId);
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const targetSiteId = roleName === 'facility_manager' ? (req.user!.managed_site?.id || req.user!.site_id || undefined) : undefined;
        const result = await pmScheduleService.bulkDelete(targetOrgId, req.body, this.getAuditContext(req), targetSiteId);
        res.json(result);
    }
}

export const pmScheduleController = new PMScheduleController();
