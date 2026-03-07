import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { CreateUserDTO, UpdateUserDTO, UserListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO } from '../types/common.dto';

class UserController {
    private getAuditContext(req: Request): AuditContext {
        return { orgId: req.user!.org_id, userId: req.user!.id, userEmail: req.user!.email };
    }

    private getRequestorRole(req: Request): string {
        return req.user!.Role?.name?.toLowerCase() || '';
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query: UserListQuery = req.query as any;
            const users = await userService.getAll(req.user!.org_id, query);
            res.json(users);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.getById(req.params.user_id as string, req.user!.org_id);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: CreateUserDTO = req.body;
            const user = await userService.create(req.user!.org_id, dto, this.getAuditContext(req), this.getRequestorRole(req));
            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: UpdateUserDTO = req.body;
            const user = await userService.update(req.params.user_id as string, req.user!.org_id, dto, this.getAuditContext(req), this.getRequestorRole(req));
            res.json(user);
        } catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await userService.delete(req.params.user_id as string, req.user!.org_id, this.getAuditContext(req));
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: BulkDeleteDTO = req.body;
            const result = await userService.bulkDelete(req.user!.org_id, dto, this.getAuditContext(req), req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const userController = new UserController();
