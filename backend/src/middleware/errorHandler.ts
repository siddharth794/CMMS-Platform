import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            detail: err.errors.map((e: any) => e.message).join(', ')
        });
    }

    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ detail: message });
};
