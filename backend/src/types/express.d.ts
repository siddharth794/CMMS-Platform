/**
 * Augment Express Request with authenticated user payload.
 * This enables strong typing across controllers/middleware.
 */
export interface AuthenticatedUser {
    id: string;
    org_id: string;
    site_id?: string | null;
    email: string;
    username: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active: boolean;
    role_id: number;
    Role?: {
        id: number;
        name: string;
        description?: string;
        permissions?: Record<string, any>;
        is_system_role?: boolean;
    };
    effectiveRoles?: any[];
    effectiveAccesses?: any[];
    site?: any;
    managed_site?: any;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
            id?: string; // request ID from requestId middleware
        }
    }
}

export {};
