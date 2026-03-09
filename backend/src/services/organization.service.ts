import { organizationRepository } from '../repositories/organization.repository';
import { CreateOrganizationDTO } from '../types/dto';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors/AppError';

class OrganizationService {
    async create(dto: CreateOrganizationDTO): Promise<any> {
        const existing = await organizationRepository.findByName(dto.name);
        if (existing) throw new ConflictError('Organization name already exists');

        return organizationRepository.create(dto);
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
