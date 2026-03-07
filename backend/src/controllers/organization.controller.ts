import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { CreateOrganizationDTO } from '../types/dto';

class OrganizationController {
    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: CreateOrganizationDTO = req.body;
        const org = await organizationService.create(dto);
        res.status(201).json(org);
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { skip = 0, limit = 100, record_status, name } = req.query;
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const orgs = await organizationService.getAll(Number(skip), Number(limit), userRole, { record_status, name });
        res.json(orgs);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const org = await organizationService.getById(req.params.org_id as string, req.user!.org_id, userRole);
        res.json(org);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const org = await organizationService.update(req.params.org_id as string, req.body, req.user!.org_id, userRole);
        res.json(org);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userRole = req.user!.Role?.name?.toLowerCase() || '';
        const force = req.query.force === 'true';
        await organizationService.delete(req.params.org_id as string, force, userRole);
        res.status(204).send();
    }
}

export const organizationController = new OrganizationController();
