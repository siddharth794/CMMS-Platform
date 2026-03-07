import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import logger from '../config/logger';

export interface AuthRequest extends Request {
    user?: any;
}

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
        logger.fatal('JWT_SECRET environment variable is required. Exiting.');
        process.exit(1);
    }
    return secret;
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ detail: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, getJwtSecret()) as any;

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

/**
 * RBAC middleware. All role comparisons are done in lowercase.
 * Use centralized role constants from constants/roles.ts.
 */
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.Role) {
            res.status(403).json({ detail: 'Insufficient permissions' });
            return;
        }

        const userRole = req.user.Role.name.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({ detail: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
