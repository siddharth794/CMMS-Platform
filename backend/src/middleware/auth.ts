import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ detail: 'Authentication required' });
            return;
        }

        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'supersecretkey';
        const decoded = jwt.verify(token, secret) as any;

        // Also load user role if needed
        const user = await User.findByPk(decoded.sub || decoded.id, {
            include: [{ model: Role }]
        });

        if (!user) {
            res.status(401).json({ detail: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ detail: 'Invalid or expired token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.Role || !roles.includes(req.user.Role.name)) {
            res.status(403).json({ detail: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
