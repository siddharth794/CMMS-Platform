import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role, Access, Group, Organization } from '../models';
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
            include: [
                { model: Role, include: [{ model: Access }] },
                { model: Group, include: [{ model: Role, include: [{ model: Access }] }] },
                { model: Organization }
            ]
        });

        if (!user) {
            res.status(401).json({ detail: 'User not found' });
            return;
        }

        const userJSON = user.toJSON();

        // Calculate Effective Roles and Accesses
        const directRoles = userJSON.Roles || [];
        const groupRoles = (userJSON.Groups || []).flatMap((g: any) => g.Roles || []);
        
        const allRolesMap = new Map();
        [...directRoles, ...groupRoles].forEach(r => allRolesMap.set(r.id, r));
        const effectiveRoles = Array.from(allRolesMap.values());

        const accessMap = new Map();
        effectiveRoles.forEach((r: any) => {
            (r.Accesses || []).forEach((a: any) => accessMap.set(a.name, a));
        });
        const effectiveAccesses = Array.from(accessMap.values());

        // Legacy Support for code expecting req.user.Role
        userJSON.Role = effectiveRoles[0] || null;
        userJSON.effectiveRoles = effectiveRoles;
        userJSON.effectiveAccesses = effectiveAccesses;

        req.user = userJSON;
        next();
    } catch (err) {
        logger.error(err);
        res.status(401).json({ detail: 'Invalid or expired token' });
    }
};

/**
 * RBAC middleware. All role comparisons are done in lowercase.
 * Supports legacy `req.user.Role` as well as checking against `req.user.effectiveRoles`.
 */
export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || (!req.user.Role && !req.user.effectiveRoles)) {
            res.status(403).json({ detail: 'Insufficient permissions' });
            return;
        }

        const allowedRoles = roles.map(r => r.toLowerCase());
        
        let hasAccess = false;
        if (req.user.effectiveRoles) {
            const userRoles = req.user.effectiveRoles.map((r: any) => r.name.toLowerCase());
            hasAccess = allowedRoles.some(allowed => userRoles.includes(allowed));
        } else if (req.user.Role) {
            hasAccess = allowedRoles.includes(req.user.Role.name.toLowerCase());
        }

        if (!hasAccess) {
            res.status(403).json({ detail: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

/**
 * Granular Permission Middleware
 */
export const requirePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.effectiveAccesses) {
            res.status(403).json({ detail: 'Insufficient access' });
            return;
        }

        // Allow super_admin to do everything, bypassing granular checks
        if (req.user.effectiveRoles?.some((r: any) => r.name.toLowerCase() === 'super_admin')) {
            return next();
        }

        const hasAccess = req.user.effectiveAccesses.some((a: any) => a.name === permission);

        if (!hasAccess) {
            res.status(403).json({ detail: 'Insufficient access' });
            return;
        }

        next();
    };
};
