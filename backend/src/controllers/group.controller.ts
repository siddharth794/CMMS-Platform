import { Request, Response, NextFunction } from 'express';
import { groupService } from '../services/group.service';

class GroupController {
    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const groups = await groupService.getByOrgId(req.user!.org_id);
        res.json(groups);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const group = await groupService.create(req.user!.org_id, req.body);
        res.status(201).json(group);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const group = await groupService.update(req.params.group_id as string, req.user!.org_id, req.body);
        res.json(group);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await groupService.delete(req.params.group_id as string, req.user!.org_id);
        res.status(204).send();
    }

    updateMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { user_ids } = req.body;
        const group = await groupService.updateMembers(req.params.group_id as string, req.user!.org_id, user_ids);
        res.json(group);
    }

    updateRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { role_ids } = req.body;
        const requestorRole = req.user!.Role?.name?.toLowerCase() || '';
        const group = await groupService.updateRoles(req.params.group_id as string, req.user!.org_id, role_ids, requestorRole);
        res.json(group);
    }
}

export const groupController = new GroupController();
