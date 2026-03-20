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
        const targetOrgId = (roleName === 'super_admin' && org_id) ? String(org_id) : req.user!.org_id;
        
        // Scope by site
        let targetSiteId = site_id as string | undefined;
        if (roleName === 'facility_manager') {
            targetSiteId = req.user!.site_id || undefined;
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
        const pm = await pmScheduleService.getById(req.params.pm_id as string, targetOrgId);
        res.json(pm);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = (roleName === 'super_admin' && req.body.org_id) ? req.body.org_id : req.user!.org_id;
        
        // Auto-assign site for Facility Managers
        if (roleName === 'facility_manager' && !req.body.site_id) {
            req.body.site_id = req.user!.site_id;
        }

        const pm = await pmScheduleService.create(targetOrgId, req.body as CreatePMScheduleDTO, this.getAuditContext(req));
        res.status(201).json(pm);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const pm = await pmScheduleService.update(req.params.pm_id as string, targetOrgId, req.body as UpdatePMScheduleDTO);
        res.json(pm);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const result = await pmScheduleService.delete(req.params.pm_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const result = await pmScheduleService.restore(req.params.pm_id as string, targetOrgId, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = req.user!.Role?.name?.toLowerCase() || '';
        const targetOrgId = roleName === 'super_admin' ? null : req.user!.org_id;
        const result = await pmScheduleService.bulkDelete(targetOrgId, req.body, this.getAuditContext(req));
        res.json(result);
    }
}

export const pmScheduleController = new PMScheduleController();
