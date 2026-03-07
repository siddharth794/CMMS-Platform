import { Request, Response, NextFunction } from 'express';
import { pmScheduleService } from '../services/pmSchedule.service';
import { CreatePMScheduleDTO, UpdatePMScheduleDTO } from '../types/dto';
import { AuditContext } from '../types/common.dto';

class PMScheduleController {
    private getAuditContext(req: Request): AuditContext {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { skip = 0, limit = 100, asset_id } = req.query;
            const pms = await pmScheduleService.getAll(req.user!.org_id, asset_id as string | undefined, Number(skip), Number(limit));
            res.json(pms);
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pm = await pmScheduleService.getById(req.params.pm_id as string, req.user!.org_id);
            res.json(pm);
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pm = await pmScheduleService.create(req.user!.org_id, req.body as CreatePMScheduleDTO, this.getAuditContext(req));
            res.status(201).json(pm);
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const pm = await pmScheduleService.update(req.params.pm_id as string, req.user!.org_id, req.body as UpdatePMScheduleDTO);
            res.json(pm);
        } catch (err) { next(err); }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await pmScheduleService.delete(req.params.pm_id as string, req.user!.org_id);
            res.json(result);
        } catch (err) { next(err); }
    }
}

export const pmScheduleController = new PMScheduleController();
