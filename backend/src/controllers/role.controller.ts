import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';
import { CreateRoleDTO, UpdateRoleDTO } from '../types/dto';

class RoleController {
    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roles = await roleService.getByOrgId(req.user!.org_id);
        res.json(roles);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: CreateRoleDTO = req.body;
        const role = await roleService.create(req.user!.org_id, dto);
        res.status(201).json(role);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: UpdateRoleDTO = req.body;
        const role = await roleService.update(Number(req.params.role_id), req.user!.org_id, dto);
        res.json(role);
    }
}

export const roleController = new RoleController();
