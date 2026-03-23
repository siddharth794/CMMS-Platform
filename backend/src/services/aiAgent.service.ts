import { workOrderService } from './workOrder.service';
import { Site } from '../models';
import { AuditContext } from '../types/common.dto';
import { NotFoundError, BadRequestError } from '../errors/AppError';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SmartCreatePayload {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    site_id: string; // Now required
    location: string; // Now required
}

export class AIAgentService {
    async smartCreateWorkOrder(payload: SmartCreatePayload, user: any, auditContext: AuditContext): Promise<any> {
        const { title, description, priority, site_id, location } = payload;
        
        if (!site_id) {
            throw new BadRequestError('site_id is required from the AI agent payload.');
        }

        if (!location) {
            throw new BadRequestError('location is required from the AI agent payload.');
        }

        // 1. Validate Site and Extract Organization
        const site = await Site.findByPk(site_id);
        if (!site) {
            throw new NotFoundError(`Site with ID ${site_id}`);
        }
        
        const orgId = site.org_id;

        // 2. Create the Work Order
        const newWo = await workOrderService.create(orgId, user.id, {
            title,
            description,
            priority: priority || 'medium',
            site_id: site.id,
            location
        } as any, auditContext);

        return {
            status: 'success',
            message: `Work order created successfully with ID ${newWo.wo_number}`,
            wo_number: newWo.wo_number,
            data: newWo
        };
    }
}

export const aiAgentService = new AIAgentService();
