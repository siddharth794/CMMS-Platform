import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { LoginDTO } from '../types/dto';

class AuthController {
    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const dto: LoginDTO = req.body;
        const result = await authService.login(dto);
        res.json(result);
    }

    me = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        res.json(req.user);
    }
}

export const authController = new AuthController();
