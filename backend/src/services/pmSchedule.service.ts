import { pmScheduleRepository } from '../repositories/pmSchedule.repository';
import { auditService } from './audit.service';
import { CreatePMScheduleDTO, UpdatePMScheduleDTO } from '../types/dto';
import { AuditContext } from '../types/common.dto';
import { NotFoundError } from '../errors/AppError';

class PMScheduleService {
    async getAll(orgId: string, assetId: string | undefined, skip: number, limit: number): Promise<any[]> {
        return pmScheduleRepository.findAll(orgId, assetId, skip, limit);
    }

    async getById(pmId: string, orgId: string): Promise<any> {
        const pm = await pmScheduleRepository.findById(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');
        return pm;
    }

    async create(orgId: string, dto: CreatePMScheduleDTO, audit: AuditContext): Promise<any> {
        const pm = await pmScheduleRepository.create({ ...dto, org_id: orgId });
        const fullyLoaded = await pmScheduleRepository.findByPkWithAsset(pm.id);

        auditService.log({ ...audit, entityType: 'PMSchedule', entityId: pm.id, action: 'create', newValues: { name: pm.name } });
        return fullyLoaded;
    }

    async update(pmId: string, orgId: string, dto: UpdatePMScheduleDTO): Promise<any> {
        const pm = await pmScheduleRepository.findById(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');

        await pm.update(dto);
        return pmScheduleRepository.findByPkWithAsset(pm.id);
    }

    async delete(pmId: string, orgId: string): Promise<{ message: string }> {
        const pm = await pmScheduleRepository.findById(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');

        pm.is_active = false;
        await pm.save();
        return { message: 'PM schedule deactivated' };
    }
}

export const pmScheduleService = new PMScheduleService();
