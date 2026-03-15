import { Request, Response, NextFunction } from 'express';
import { siteService } from '../services/site.service';
import { CreateSiteDTO, UpdateSiteDTO, SiteListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class SiteController {
    private getAuditContext(req: Request): AuditContext {
        return { 
            orgId: req.user!.org_id, 
            userId: req.user!.id, 
            userEmail: req.user!.email,
            ipAddress: req.ip || req.socket.remoteAddress
        };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            let targetOrgId = req.user!.org_id;
            
            if (roleName === 'super_admin') {
                targetOrgId = req.query.org_id ? String(req.query.org_id) : (null as unknown as string);
            }

            const result = await siteService.getAll(targetOrgId, req.query as unknown as SiteListQuery);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            const site = await siteService.getById(req.params.site_id as string, targetOrgId);
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as CreateSiteDTO;
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = (roleName === 'super_admin' && body.org_id) ? body.org_id : req.user!.org_id;

            const site = await siteService.create(targetOrgId, body, this.getAuditContext(req));
            res.status(201).json(site);
        } catch (error) {
            next(error);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            const site = await siteService.update(req.params.site_id as string, targetOrgId, req.body as UpdateSiteDTO, this.getAuditContext(req));
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;
            const force = req.query.force === 'true';

            await siteService.delete(req.params.site_id as string, targetOrgId, this.getAuditContext(req), force);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            await siteService.restore(req.params.site_id as string, targetOrgId, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            const result = await siteService.bulkDelete(targetOrgId, req.body as BulkDeleteDTO, this.getAuditContext(req));
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    assignManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            const site = await siteService.assignManager(req.params.site_id as string, targetOrgId, req.body.manager_id, this.getAuditContext(req));
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    assignTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            await siteService.assignTechnician(req.params.site_id as string, targetOrgId, req.params.user_id as string, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    removeTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = req.user!.effectiveRoles?.[0]?.name?.toLowerCase() || req.user!.Role?.name?.toLowerCase() || '';
            const targetOrgId = roleName === 'super_admin' ? (null as unknown as string) : req.user!.org_id;

            await siteService.removeTechnician(req.params.site_id as string, targetOrgId, req.params.user_id as string, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export const siteController = new SiteController();
