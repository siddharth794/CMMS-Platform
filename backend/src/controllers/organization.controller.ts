import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { CreateOrganizationDTO } from '../types/dto';

class OrganizationController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: CreateOrganizationDTO = req.body;
            const org = await organizationService.create(dto);
            res.status(201).json(org);
        } catch (err) {
            next(err);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { skip = 0, limit = 100 } = req.query;
            const userRole = req.user!.Role?.name?.toLowerCase() || '';
            const orgs = await organizationService.getAll(Number(skip), Number(limit), userRole);
            res.json(orgs);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userRole = req.user!.Role?.name?.toLowerCase() || '';
            const org = await organizationService.getById(req.params.org_id as string, req.user!.org_id, userRole);
            res.json(org);
        } catch (err) {
            next(err);
        }
    }
}

export const organizationController = new OrganizationController();
