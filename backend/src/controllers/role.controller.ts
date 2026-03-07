import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';
import { CreateRoleDTO, UpdateRoleDTO } from '../types/dto';

class RoleController {
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const roles = await roleService.getByOrgId(req.user!.org_id);
            res.json(roles);
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: CreateRoleDTO = req.body;
            const role = await roleService.create(req.user!.org_id, dto);
            res.status(201).json(role);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: UpdateRoleDTO = req.body;
            const role = await roleService.update(Number(req.params.role_id), req.user!.org_id, dto);
            res.json(role);
        } catch (err) {
            next(err);
        }
    }
}

export const roleController = new RoleController();
