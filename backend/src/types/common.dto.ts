/**
 * Common DTOs used across multiple modules.
 */

/** Standard paginated query parameters */
export interface PaginationQuery {
    skip?: number;
    limit?: number;
    search?: string;
    record_status?: 'active' | 'inactive';
}

/** Standard paginated response wrapper */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    limit: number;
}

/** Bulk delete request DTO */
export interface BulkDeleteDTO {
    ids: string[];
    force?: boolean;
}

/** Audit context passed from controller to service */
export interface AuditContext {
    orgId: string;
    userId: string;
    userEmail: string;
}

/** Standard message response */
export interface MessageResponse {
    message: string;
}
