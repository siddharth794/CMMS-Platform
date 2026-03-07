import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { CreateUserDTO, UpdateUserDTO, UserListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class UserController {
    private getAuditContext = (req: Request): AuditContext => {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    private getRequestorRole(req: Request): string {
        return req.user!.Role?.name?.toLowerCase() || '';
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const query: UserListQuery = req.query as any;
        const userRole = this.getRequestorRole(req);
        const targetOrgId = (userRole === 'super_admin' && req.query.org_id) ? String(req.query.org_id) : req.user!.org_id;

        const users = await userService.getAll(targetOrgId, query);
        res.json(users);
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const user = await userService.getById(req.params.user_id as string, req.user!.org_id);
        res.json(user);
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: CreateUserDTO = req.body;
        const user = await userService.create(req.user!.org_id, dto, this.getAuditContext(req), this.getRequestorRole(req));
        res.status(201).json(user);
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: UpdateUserDTO = req.body;
        const user = await userService.update(req.params.user_id as string, req.user!.org_id, dto, this.getAuditContext(req), this.getRequestorRole(req));
        res.json(user);
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const result = await userService.delete(req.params.user_id as string, req.user!.org_id, this.getAuditContext(req));
        res.json(result);
    }

    bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: BulkDeleteDTO = req.body;
        const result = await userService.bulkDelete(req.user!.org_id, dto, this.getAuditContext(req), req.user!.id);
        res.json(result);
    }

    updateRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { role_ids } = req.body;
        const user = await userService.updateRoles(req.params.user_id as string, req.user!.org_id, role_ids, this.getRequestorRole(req));
        res.json(user);
    }

    updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const user = await userService.updateProfile(req.user!.id, req.user!.org_id, req.body);
        res.json(user);
    }

    updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await userService.updatePassword(req.user!.id, req.user!.org_id, req.body);
        res.status(204).send();
    }
}

export const userController = new UserController();
