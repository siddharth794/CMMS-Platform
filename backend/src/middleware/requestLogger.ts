import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * HTTP request logging middleware.
 * Logs method, URL, status code, response time, and user context after each request completes.
 */
export const requestLogger = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const start = Date.now();
        res.on('finish', () => {
            const durationMs = Date.now() - start;
            const logData = {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs,
                requestId: (req as any).id,
                userId: (req as any).user?.id,
                orgId: (req as any).user?.org_id,
            };

            if (res.statusCode >= 500) {
                logger.error(logData, 'Request failed');
            } else if (res.statusCode >= 400) {
                logger.warn(logData, 'Request client error');
            } else {
                logger.info(logData, 'Request completed');
            }
        });
        next();
    };
};
