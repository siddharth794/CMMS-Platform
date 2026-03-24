import { workOrderService } from './workOrder.service';
import { workOrderRepository } from '../repositories/workOrder.repository';
import { siteRepository } from '../repositories/site.repository';
import { AuditContext } from '../types/common.dto';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { AuthenticatedUser } from '../types/express';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SmartCreatePayload {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    site_id: string;
    location: string;
}

export interface SmartCreateResponse {
    status: string;
    message: string;
    wo_number: string;
    data: any;
}

export interface LatestWorkOrdersResponse {
    status: string;
    data: any[];
    total: number;
}

export class AIAgentService {
    async smartCreateWorkOrder(payload: SmartCreatePayload, user: AuthenticatedUser, auditContext: AuditContext): Promise<SmartCreateResponse> {
        const { title, description, priority, site_id, location } = payload;
        
        if (!site_id) {
            throw new BadRequestError('site_id is required from the AI agent payload.');
        }

        if (!location) {
            throw new BadRequestError('location is required from the AI agent payload.');
        }

        if (!title || title.trim().length === 0) {
            throw new BadRequestError('title is required and cannot be empty.');
        }

        const site = await siteRepository.findById(site_id, null);
        if (!site) {
            throw new NotFoundError(`Site with ID ${site_id}`);
        }
        
        const orgId = site.org_id;

        const newWo = await workOrderService.create(orgId, user.id, {
            title: title.trim(),
            description: description?.trim(),
            priority: priority || 'medium',
            site_id: site.id,
            location: location.trim()
        } as any, auditContext);

        return {
            status: 'success',
            message: `Work order created successfully with ID ${newWo.wo_number}`,
            wo_number: newWo.wo_number,
            data: newWo
        };
    }

    async getLatestWorkOrders(site_id: string, location?: string): Promise<LatestWorkOrdersResponse> {
        if (!site_id) {
            throw new BadRequestError('site_id is required.');
        }

        const site = await siteRepository.findById(site_id, null);
        if (!site) {
            throw new NotFoundError(`Site with ID ${site_id}`);
        }

        const where: any = { site_id };
        if (location) {
            where.location = location;
        }

        const result = await workOrderRepository.findAndCountAll(where, true, 0, 10);

        return {
            status: 'success',
            data: result.rows,
            total: result.count
        };
    }
}

export const aiAgentService = new AIAgentService();
