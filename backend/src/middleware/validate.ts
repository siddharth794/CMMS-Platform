import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Parses req.body against the provided schema.
 * On success: replaces req.body with validated (whitelisted) data.
 * On failure: returns 400 with field-level error details.
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const zodError = result.error as ZodError;
            res.status(400).json({
                detail: 'Validation failed',
                errors: zodError.flatten().fieldErrors,
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
