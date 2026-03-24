import { Op, UniqueConstraintError } from 'sequelize';
import { workOrderRepository } from '../repositories/workOrder.repository';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import {
    CreateWorkOrderDTO, UpdateWorkOrderDTO, WorkOrderListQuery,
    StatusUpdateDTO, AssignDTO, CommentDTO, InventoryUsageDTO
} from '../types/dto';
import { AuditContext, BulkDeleteDTO, PaginatedResponse } from '../types/common.dto';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/AppError';
import { AuthenticatedUser } from '../types/express';
import { WO_STATUS, WO_STATUS_TRANSITIONS } from '../constants/workOrder';

function generateWoNumber(): string {
    const prefix = "WO";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${date}-${randomSuffix}`;
}

class WorkOrderService {
    async getAll(orgId: string | null, userId: string, roleName: string, query: WorkOrderListQuery, siteIdRestriction?: string | null): Promise<PaginatedResponse<any>> {
        const { skip = 0, limit = 100, status, priority, assignee_id, asset_id, search, record_status, site_id } = query;
        let where: any = {};
        if (orgId) where.org_id = orgId;

        // Apply site visibility/filter
        if (siteIdRestriction) {
            where.site_id = siteIdRestriction; // Strict restriction for FM
        } else if (site_id) {
            where.site_id = site_id; // Voluntary filter for others
        }
        let paranoid = true;

        if (record_status === 'inactive') {
            paranoid = false;
            where.deleted_at = { [Op.not]: null };
        }

        if (roleName === 'technician') where.assignee_id = userId;
        else if (['requestor', 'requester'].includes(roleName)) where.requester_id = userId;

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignee_id) where.assignee_id = assignee_id;
        if (asset_id) where.asset_id = asset_id;

        if (search) {
            where[Op.or] = [
                { wo_number: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const result = await workOrderRepository.findAndCountAll(where, paranoid, Number(skip), Number(limit));
        return { data: result.rows, total: result.count, skip: Number(skip), limit: Number(limit) };
    }

    async getById(woId: string, orgId: string | null): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrgFull(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');
        return wo;
    }

    async create(orgId: string, userId: string, dto: CreateWorkOrderDTO, audit: AuditContext): Promise<any> {
        const MAX_RETRIES = 5;
        let wo: any;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const data: any = { ...dto, org_id: orgId, requester_id: userId, wo_number: generateWoNumber(), status: 'new' };
            if (data.asset_id === "") data.asset_id = null;

            try {
                wo = await workOrderRepository.create(data);
                break;
            } catch (err: any) {
                if (err instanceof UniqueConstraintError && attempt < MAX_RETRIES - 1) continue;
                throw err;
            }
        }

        const loaded = await workOrderRepository.findByPkFull(wo!.id);

        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo!.id, action: 'create', newValues: { wo_number: wo!.wo_number, title: wo!.title } });
        return loaded;
    }

    async update(woId: string, orgId: string | null, dto: UpdateWorkOrderDTO, audit: AuditContext): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        // Block status changes — must use PATCH /:wo_id/status instead
        if (dto.status && dto.status !== wo.status) {
            throw new BadRequestError('Status changes must use the dedicated status update endpoint (PATCH /:wo_id/status).');
        }

        const updateData: any = { ...dto };
        delete updateData.status;
        if (updateData.asset_id === "") updateData.asset_id = null;

        await wo.update(updateData);

        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'update', newValues: dto as any });
        return workOrderRepository.findByPkFull(wo.id);
    }

    async updateStatus(woId: string, orgId: string | null, dto: StatusUpdateDTO, user: any, audit: AuditContext): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        const roleName = user.Role?.name.toLowerCase() || '';
        const oldStatus = wo.status;

        // 1. Check Transition Validity
        const allowed = WO_STATUS_TRANSITIONS[oldStatus] || [];
        const isSelfTransitionWithNotes = dto.status === oldStatus && dto.notes;
        
        if (!allowed.includes(dto.status) && !isSelfTransitionWithNotes) {
            throw new BadRequestError(`Invalid status transition from ${oldStatus} to ${dto.status}`);
        }

        // 2. Role-Based Restrictions
        if (dto.status === WO_STATUS.COMPLETED || (oldStatus === WO_STATUS.PENDING_REVIEW && dto.status === WO_STATUS.IN_PROGRESS)) {
            const isManager = ['super_admin', 'org_admin', 'facility_manager'].includes(roleName);
            if (!isManager) {
                throw new ForbiddenError('Only managers can approve or reject work orders.');
            }
        }

        // 3. Mandatory Checklists/Fields
        if (dto.status === WO_STATUS.PENDING_REVIEW || dto.status === WO_STATUS.COMPLETED) {
            if (!dto.notes && !wo.resolution_notes) {
                throw new BadRequestError('Resolution notes are required when completing or submitting for review.');
            }
            
            if (['high', 'critical'].includes(wo.priority)) {
                const attachmentCount = await workOrderRepository.countAttachments(wo.id);
                if (attachmentCount === 0) {
                    throw new BadRequestError('Attachments (proof of work) are required for High/Critical priority work orders.');
                }
            }
        }

        // 4. Update Status and related fields
        wo.status = dto.status;

        if (dto.notes) {
            wo.resolution_notes = dto.notes;
            wo.notes = (wo.notes || "") + `\n[${new Date().toISOString()}] Status changed to ${dto.status} by ${user.first_name}: ${dto.notes}`;
        }

        if (dto.status === WO_STATUS.IN_PROGRESS && !wo.actual_start) {
            wo.actual_start = new Date();
        } else if (dto.status === WO_STATUS.COMPLETED && !wo.actual_end) {
            wo.actual_end = new Date();
        }

        await wo.save();

        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'status_change', oldValues: { status: oldStatus }, newValues: { status: dto.status } });
        return workOrderRepository.findByPkFull(wo.id);
    }

    async assign(woId: string, orgId: string | null, dto: AssignDTO, audit: AuditContext): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        wo.assignee_id = dto.assignee_id;
        if (wo.status === 'new') wo.status = 'open';
        await wo.save();

        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'assign', newValues: { assignee_id: dto.assignee_id } });
        return workOrderRepository.findByPkFull(wo.id);
    }

    async delete(woId: string, orgId: string | null, audit: AuditContext, force: boolean = false): Promise<{ message: string }> {
        const wo = await workOrderRepository.findByIdParanoid(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        if (force || wo.deleted_at !== null) {
            await workOrderRepository.hardDelete(wo);
            auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'hard_delete' });
            return { message: 'Work order permanently deleted' };
        }

        await workOrderRepository.softDelete(wo);
        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'delete' });
        return { message: 'Work order deactivated (soft delete)' };
    }

    async restore(woId: string, orgId: string | null, audit: AuditContext): Promise<{ message: string }> {
        const wo = await workOrderRepository.findByIdParanoid(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        if (wo.deleted_at !== null) {
            await workOrderRepository.restore(wo);
            auditService.log({ ...audit, entityType: 'WorkOrder', entityId: wo.id, action: 'restore' });
            return { message: 'Work order restored successfully' };
        }
        
        return { message: 'Work order is already active' };
    }

    async bulkDelete(orgId: string | null, dto: BulkDeleteDTO, audit: AuditContext): Promise<{ message: string }> {
        const count = await workOrderRepository.bulkDelete(dto.ids, orgId, !!dto.force);
        auditService.log({ ...audit, entityType: 'WorkOrder', entityId: dto.ids[0], action: dto.force ? 'bulk_hard_delete' : 'bulk_delete', newValues: { deleted_ids: dto.ids, count } });
        return { message: `${count} Work Orders successfully ${dto.force ? 'permanently deleted' : 'deactivated'}.` };
    }

    // ─── Comments ─────────────────────────────────────────────────
    async getComments(woId: string, orgId: string | null): Promise<any[]> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');
        return workOrderRepository.findComments(woId);
    }

    async addComment(woId: string, orgId: string | null, dto: CommentDTO, user: AuthenticatedUser, io: any): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        const comment = await workOrderRepository.createComment({
            work_order_id: woId,
            user_id: user.id,
            message: dto.message.trim()
        });

        if (io) io.to(`wo_${woId}`).emit('new_comment', comment);
        notificationService.notifyCommentAdded({ workOrder: wo, commenter: user as any, io });

        return comment;
    }

    // ─── Inventory Usage ──────────────────────────────────────────
    async getUsedParts(woId: string, orgId: string | null): Promise<any[]> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');
        return workOrderRepository.findUsedParts(woId);
    }

    async addInventoryUsage(woId: string, orgId: string | null, dto: InventoryUsageDTO): Promise<any> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');

        try {
            return await workOrderRepository.addInventoryUsage(woId, dto.inventory_item_id, dto.quantity_used, orgId as any);
        } catch (err: any) {
            throw new BadRequestError(err.message);
        }
    }

    async removeInventoryUsage(woId: string, usageId: string, orgId: string | null): Promise<{ message: string }> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');
        try {
            await workOrderRepository.removeInventoryUsage(usageId, woId);
            return { message: 'Part usage removed, stock restored.' };
        } catch (err: any) {
            throw new NotFoundError('Usage record');
        }
    }

    // ─── Attachments ──────────────────────────────────────────────
    async addAttachments(woId: string, orgId: string | null, filenames: string[]): Promise<any[]> {
        const wo = await workOrderRepository.findByIdAndOrg(woId, orgId);
        if (!wo) throw new NotFoundError('Work order');
        if (!filenames.length) throw new BadRequestError('No files uploaded. Ensure images are < 1MB and max 3 files.');

        return workOrderRepository.createAttachments(woId, filenames);
    }
}

export const workOrderService = new WorkOrderService();
