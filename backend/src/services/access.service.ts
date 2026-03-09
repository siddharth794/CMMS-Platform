import { accessRepository } from '../repositories/access.repository';
import { CreateAccessDTO, UpdateAccessDTO } from '../types/dto';
import { NotFoundError, BadRequestError } from '../errors/AppError';

class AccessService {
    async getByOrgId(orgId: string): Promise<any[]> {
        return accessRepository.findByOrgId(orgId);
    }

    async create(orgId: string, dto: CreateAccessDTO): Promise<any> {
        return accessRepository.create({ org_id: orgId, ...dto, is_system: false });
    }

    async update(accessId: string, orgId: string, dto: UpdateAccessDTO): Promise<any> {
        const access = await accessRepository.findById(accessId, orgId);
        if (!access) throw new NotFoundError('Access feature');
        if (access.is_system) throw new BadRequestError('Cannot modify system access features');

        return accessRepository.update(accessId, dto);
    }

    async delete(accessId: string, orgId: string): Promise<void> {
        const access = await accessRepository.findById(accessId, orgId);
        if (!access) throw new NotFoundError('Access feature');
        if (access.is_system) throw new BadRequestError('Cannot delete system access features');

        await accessRepository.delete(accessId);
    }
}

export const accessService = new AccessService();
