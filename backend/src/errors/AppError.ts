/**
 * Base application error class.
 * All custom errors should extend this class.
 * The centralized error handler knows how to serialize these.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── 400 Bad Request ──────────────────────────────────────────────
export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string>[];

    constructor(message = 'Validation failed', errors: Record<string, string>[] = []) {
        super(message, 400);
        this.errors = errors;
    }
}

// ─── 401 Unauthorized ─────────────────────────────────────────────
export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}

// ─── 403 Forbidden ────────────────────────────────────────────────
export class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
    }
}

// ─── 404 Not Found ────────────────────────────────────────────────
export class NotFoundError extends AppError {
    constructor(entity = 'Resource') {
        super(`${entity} not found`, 404);
    }
}

export class ClarificationRequiredError extends AppError {
    public readonly field: string;
    public readonly options: string[];

    constructor(message: string, field: string, options: string[] = []) {
        super(message, 200); // We return 200 OK because it's a valid conversational state, not an HTTP error
        this.field = field;
        this.options = options;
    }
}

// ─── 409 Conflict ─────────────────────────────────────────────────
export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

// ─── 429 Too Many Requests ────────────────────────────────────────
export class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests. Try again later.') {
        super(message, 429);
    }
}

// ─── 500 Internal Server Error ────────────────────────────────────
export class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false);
    }
}
