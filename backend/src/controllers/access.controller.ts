import { Request, Response, NextFunction } from 'express';
import { accessService } from '../services/access.service';
import { CreateAccessDTO, UpdateAccessDTO } from '../types/dto';

class AccessController {
    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const accesses = await accessService.getByOrgId(req.user!.org_id);
        res.json(accesses);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: CreateAccessDTO = req.body;
        const access = await accessService.create(req.user!.org_id, dto);
        res.status(201).json(access);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: UpdateAccessDTO = req.body;
        const access = await accessService.update(req.params.access_id as string, req.user!.org_id, dto);
        res.json(access);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await accessService.delete(req.params.access_id as string, req.user!.org_id);
        res.status(204).send();
    }
}

export const accessController = new AccessController();
