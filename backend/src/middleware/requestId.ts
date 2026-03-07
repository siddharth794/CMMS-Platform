import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Assigns a unique request ID to each incoming request.
 * If the client provides an 'x-request-id' header, it is reused.
 */
export const requestId = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const id = (req.headers['x-request-id'] as string) || randomUUID();
        (req as any).id = id;
        res.setHeader('x-request-id', id);
        next();
    };
};
