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

        return organizationRepository.createWithRoles(dto, DEFAULT_ROLES);
    }

    async getAll(skip: number, limit: number, userRole: string): Promise<any[]> {
        if (userRole !== 'super_admin') throw new ForbiddenError();
        return organizationRepository.findAll(skip, limit);
    }

    async getById(orgId: string, userOrgId: string, userRole: string): Promise<any> {
        if (userOrgId !== orgId && userRole !== 'super_admin') throw new ForbiddenError();
        
        const org = await organizationRepository.findById(orgId);
        if (!org) throw new NotFoundError('Organization');
        return org;
    }
}

export const organizationService = new OrganizationService();
