import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { LoginDTO } from '../types/dto';

class AuthController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto: LoginDTO = req.body;
            const result = await authService.login(dto);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async me(req: Request, res: Response, _next: NextFunction): Promise<void> {
        res.json(req.user);
    }
}

export const authController = new AuthController();
