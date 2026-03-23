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

    if (err.name === 'ClarificationRequiredError') {
        res.status((err as any).statusCode || 200).json({
            status: 'needs_clarification',
            field: (err as any).field,
            message: err.message,
            options: (err as any).options
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({ detail: err.message });
        return;
    }

    // ─── Sequelize-specific errors ────────────────────────────────
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        let message = (err as any).errors?.map((e: any) => e.message).join(', ') || err.message;

        // Map technical constraint names to friendly messages for non-technical users
        if (message.includes('org_asset_tag_unique')) {
            message = 'An asset with this tag already exists within this organization. Please use a unique asset tag.';
        } else if (message.includes('organizations_name_unique')) {
            message = 'An organization with this name already exists.';
        } else if (message.includes('users_email_unique')) {
            message = 'A user with this email address already exists.';
        } else if (message.includes('work_orders_wo_number_unique')) {
            message = 'A work order with this number already exists.';
        } else if (message.includes('name must be unique')) {
            // Handle cases where validation message already exists but might need cleaning
            message = message.replace('name must be unique', 'Name must be unique within the organization');
        }

        res.status(400).json({
            detail: message
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
