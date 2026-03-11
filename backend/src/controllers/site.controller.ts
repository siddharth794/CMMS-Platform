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
            const result = await siteService.getAll(req.user!.org_id, req.query as unknown as SiteListQuery);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const site = await siteService.getById(req.params.site_id as string, req.user!.org_id);
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const site = await siteService.create(req.user!.org_id, req.body as CreateSiteDTO, this.getAuditContext(req));
            res.status(201).json(site);
        } catch (error) {
            next(error);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const site = await siteService.update(req.params.site_id as string, req.user!.org_id, req.body as UpdateSiteDTO, this.getAuditContext(req));
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await siteService.delete(req.params.site_id as string, req.user!.org_id, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await siteService.bulkDelete(req.user!.org_id, req.body as BulkDeleteDTO, this.getAuditContext(req));
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    assignManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const site = await siteService.assignManager(req.params.site_id as string, req.user!.org_id, req.body.manager_id, this.getAuditContext(req));
            res.json(site);
        } catch (error) {
            next(error);
        }
    }

    assignTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await siteService.assignTechnician(req.params.site_id as string, req.user!.org_id, req.params.user_id as string, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    removeTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await siteService.removeTechnician(req.params.site_id as string, req.user!.org_id, req.params.user_id as string, this.getAuditContext(req));
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export const siteController = new SiteController();
