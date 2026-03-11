import { Op } from 'sequelize';
import { siteRepository } from '../repositories/site.repository';
import { User, Role } from '../models';
import { auditService } from './audit.service';
import { CreateSiteDTO, UpdateSiteDTO, SiteListQuery } from '../types/dto';
import { AuditContext, PaginatedResponse, BulkDeleteDTO } from '../types/common.dto';
import { NotFoundError, BadRequestError } from '../errors/AppError';

export class SiteService {
    async getAll(orgId: string, query: SiteListQuery): Promise<PaginatedResponse<any>> {
        const { skip = 0, limit = 100, search, record_status } = query;
        let where: any = {};

        if (record_status === 'inactive') {
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
                { state: { [Op.like]: `%${search}%` } }
            ];
        }

        const { rows, count } = await siteRepository.findAll(orgId, skip, limit, where);

        return {
            data: rows,
            total: count,
            skip,
            limit
        };
    }

    async getById(siteId: string, orgId: string): Promise<any> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');
        return site;
    }

    async create(orgId: string, data: CreateSiteDTO, context: AuditContext): Promise<any> {
        // 1. Check name uniqueness
        const existingName = await siteRepository.findByName(data.name, orgId);
        if (existingName) throw new BadRequestError('Site name must be unique within the organization');

        // 2. If manager_id provided, validate manager
        if (data.manager_id) {
            await this.validateManagerAssignment(data.manager_id, orgId);
        }

        const siteData = { ...data, org_id: orgId };
        const newSite = await siteRepository.create(siteData);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: newSite.id,
            action: 'create',
            newValues: newSite.toJSON()
        });

        return newSite;
    }

    async update(siteId: string, orgId: string, data: UpdateSiteDTO, context: AuditContext): Promise<any> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');

        // 1. Check name uniqueness
        if (data.name && data.name !== site.name) {
            const existingName = await siteRepository.findByName(data.name, orgId);
            if (existingName) throw new BadRequestError('Site name must be unique within the organization');
        }

        // 2. Validate manager assignment if changing
        if (data.manager_id && data.manager_id !== site.manager_id) {
            await this.validateManagerAssignment(data.manager_id, orgId);
        }

        const oldValues = site.toJSON();
        await siteRepository.update(siteId, data, orgId);

        const updatedSite = await siteRepository.findById(siteId, orgId);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: siteId,
            action: 'update',
            oldValues: oldValues,
            newValues: updatedSite?.toJSON() || {}
        });

        return updatedSite;
    }

    async delete(siteId: string, orgId: string, context: AuditContext): Promise<void> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');

        const isHardDelete = site.deleted_at !== null;
        await siteRepository.delete(siteId, orgId, isHardDelete);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: siteId,
            action: isHardDelete ? 'hard_delete' : 'delete',
            oldValues: site.toJSON()
        });
    }

    async bulkDelete(orgId: string, data: BulkDeleteDTO, context: AuditContext): Promise<{ count: number }> {
        let count = 0;
        for (const id of data.ids) {
            try {
                await this.delete(id, orgId, context);
                count++;
            } catch (err) {
                // Ignore errors for individual items
            }
        }
        return { count };
    }

    async assignManager(siteId: string, orgId: string, managerId: string | null, context: AuditContext): Promise<any> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');

        if (managerId) {
            await this.validateManagerAssignment(managerId, orgId);
        }

        const oldValues = site.toJSON();
        await siteRepository.update(siteId, { manager_id: managerId }, orgId);

        const updatedSite = await siteRepository.findById(siteId, orgId);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: siteId,
            action: 'assign',
            oldValues: { manager_id: oldValues.manager_id },
            newValues: { manager_id: managerId }
        });

        return updatedSite;
    }

    async assignTechnician(siteId: string, orgId: string, userId: string, context: AuditContext): Promise<void> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');

        const user = await User.findOne({ where: { id: userId, org_id: orgId }, include: [{ model: Role }] }) as any;
        if (!user) throw new NotFoundError('User not found');

        // Check user role
        const roleName = user.Role?.name || (user.Roles?.[0]?.name);
        if (!roleName || roleName.toLowerCase() !== 'technician') {
            throw new BadRequestError('User is not a Technician');
        }

        await siteRepository.assignTechnician(siteId, userId, orgId);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: siteId,
            action: 'assign',
            newValues: { user_id: userId }
        });
    }

    async removeTechnician(siteId: string, orgId: string, userId: string, context: AuditContext): Promise<void> {
        const site = await siteRepository.findById(siteId, orgId);
        if (!site) throw new NotFoundError('Site not found');

        const user = await User.findOne({ where: { id: userId, org_id: orgId } }) as any;
        if (!user) throw new NotFoundError('User not found');
        if (user.site_id !== siteId) {
            throw new BadRequestError('Technician is not assigned to this site');
        }

        await siteRepository.removeTechnician(userId, orgId);

        await auditService.log({
            orgId: orgId,
            userId: context.userId,
            userEmail: context.userEmail,
            entityType: 'Site',
            entityId: siteId,
            action: 'update',
            oldValues: { user_id: userId }
        });
    }

    // --- Private Helpers ---

    private async validateManagerAssignment(managerId: string, orgId: string): Promise<void> {
        // 1. Ensure user exists and is a Facility Manager
        const user = await User.findOne({ where: { id: managerId, org_id: orgId }, include: [{ model: Role }] }) as any;
        if (!user) throw new NotFoundError('Manager user not found');

        const roleName = user.Role?.name || (user.Roles?.[0]?.name);
        // Note: the existing system uses "Facility Manager" role name
        if (!roleName || roleName.toLowerCase() !== 'facility manager') {
            throw new BadRequestError('User does not have the Facility Manager role');
        }

        // 2. Ensure FM isn't already assigned to another site
        const existingSite = await siteRepository.findByManagerId(managerId, orgId);
        if (existingSite) {
            throw new BadRequestError(`Manager is already assigned to site: ${existingSite.name}`);
        }
    }
}

export const siteService = new SiteService();
