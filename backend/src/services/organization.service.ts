import { organizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationDTO } from '../types/dto';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors/AppError';

const DEFAULT_ROLES = [
    { name: "Super_Admin", description: "Full system access", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
    { name: "Org_Admin", description: "Organization administrator", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
    { name: "Facility_Manager", description: "Manages facilities and work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true, "write": true }, "pm_schedules": { "read": true, "write": true }, "analytics": { "read": true } }, is_system_role: true },
    { name: "Technician", description: "Executes work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true },
    { name: "Requestor", description: "Creates and tracks work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true }
];

class OrganizationService {
    async create(dto: CreateOrganizationDTO): Promise<any> {
        const existing = await organizationRepository.findByName(dto.name);
        if (existing) throw new ConflictError('Organization name already exists');

        const orgRoles = DEFAULT_ROLES.map(role => ({
            ...role,
            name: role.name
        }));

        return organizationRepository.createWithRoles(dto, orgRoles);
    }

    async getAll(skip: number, limit: number, userRole: string, filters: any = {}): Promise<{ data: any[], total: number }> {
        if (userRole !== 'super_admin') throw new ForbiddenError();
        const result = await organizationRepository.findAll(skip, limit, filters);
        return { data: result.rows, total: result.count };
    }

    async getById(orgId: string, userOrgId: string, userRole: string): Promise<any> {
        if (userOrgId !== orgId && userRole !== 'super_admin') throw new ForbiddenError();
        
        const org = await organizationRepository.findById(orgId);
        if (!org) throw new NotFoundError('Organization');
        return org;
    }

    async update(id: string, data: Record<string, any>, userOrgId: string, userRole: string): Promise<any> {
        if (userOrgId !== id && userRole !== 'super_admin') throw new ForbiddenError();
        
        const org = await organizationRepository.update(id, data);
        if (!org) throw new NotFoundError('Organization');
        return org;
    }

    async delete(id: string, force: boolean, userRole: string): Promise<void> {
        if (userRole !== 'super_admin') throw new ForbiddenError();
        
        const success = await organizationRepository.delete(id, force);
        if (!success) throw new NotFoundError('Organization');
    }
}

export const organizationService = new OrganizationService();
