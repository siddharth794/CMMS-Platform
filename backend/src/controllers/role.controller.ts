import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/role.service';
import { CreateRoleDTO, UpdateRoleDTO } from '../types/dto';

class RoleController {
    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const requestorRole = req.user!.Role?.name?.toLowerCase() || '';
        const roles = await roleService.getByOrgId(req.user!.org_id, requestorRole);
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

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await roleService.delete(Number(req.params.role_id), req.user!.org_id);
        res.status(204).send();
    }

    updateAccesses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { access_ids } = req.body;
        const role = await roleService.updateAccesses(Number(req.params.role_id), req.user!.org_id, access_ids);
        res.json(role);
    }
}

export const roleController = new RoleController();
