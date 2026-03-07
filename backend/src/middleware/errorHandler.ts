import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    logger.error({ err, requestId: req.id }, `[Error] ${err.name}: ${err.message}`);

    // ─── Custom AppError hierarchy ────────────────────────────────
    if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
            detail: err.message,
            errors: err.errors
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({ detail: err.message });
        return;
    }

    // ─── Sequelize-specific errors ────────────────────────────────
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
            detail: (err as any).errors?.map((e: any) => e.message).join(', ') || err.message
        });
        return;
    }

    // ─── JWT errors ───────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json({ detail: 'Invalid or expired token' });
        return;
    }

    // ─── Fallback ─────────────────────────────────────────────────
    res.status(500).json({ detail: 'Internal server error' });
};
