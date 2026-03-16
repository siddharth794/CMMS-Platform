import { AuditLog } from '../models';
import logger from '../config/logger';

export type AuditAction =
    | 'create' | 'update' | 'delete' | 'hard_delete'
    | 'bulk_delete' | 'bulk_hard_delete'
    | 'restore' | 'bulk_restore'
    | 'status_change' | 'assign';

interface AuditParams {
    orgId: string;
    userId: string;
    userEmail: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    oldValues?: object;
    newValues?: object;
}

/**
 * Centralized audit logging service.
 * Fire-and-forget: audit log failures are logged but do not break business operations.
 */
class AuditService {
    async log(params: AuditParams): Promise<void> {
        try {
            await AuditLog.create({
                org_id: params.orgId,
                user_id: params.userId,
                user_email: params.userEmail,
                entity_type: params.entityType,
                entity_id: params.entityId,
                action: params.action,
                old_values: params.oldValues,
                new_values: params.newValues,
            });
        } catch (err) {
            logger.error({ err, params }, 'Failed to write audit log');
        }
    }
}

export const auditService = new AuditService();
