import { Request, Response, NextFunction } from 'express';
import { pmScheduleService } from '../services/pmSchedule.service';
import { CreatePMScheduleDTO, UpdatePMScheduleDTO } from '../types/dto';
import { AuditContext } from '../types/common.dto';

class PMScheduleController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { skip = 0, limit = 100, asset_id, search, record_status } = req.query;
        const result = await pmScheduleService.getAll(req.user!.org_id, {
            asset_id: asset_id as string | undefined,
            skip: Number(skip),
            limit: Number(limit),
            search: search as string | undefined,
            record_status: record_status as string | undefined
        });
        res.json(result);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const pm = await pmScheduleService.getById(req.params.pm_id as string, req.user!.org_id);
        res.json(pm);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const pm = await pmScheduleService.create(req.user!.org_id, req.body as CreatePMScheduleDTO, this.getAuditContext(req));
        res.status(201).json(pm);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const pm = await pmScheduleService.update(req.params.pm_id as string, req.user!.org_id, req.body as UpdatePMScheduleDTO);
        res.json(pm);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await pmScheduleService.delete(req.params.pm_id as string, req.user!.org_id);
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await pmScheduleService.bulkDelete(req.user!.org_id, req.body, this.getAuditContext(req));
        res.json(result);
    }
}

export const pmScheduleController = new PMScheduleController();
