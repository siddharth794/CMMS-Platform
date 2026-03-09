import { pmScheduleRepository } from '../repositories/pmSchedule.repository';
import { auditService } from './audit.service';
import { CreatePMScheduleDTO, UpdatePMScheduleDTO } from '../types/dto';
import { AuditContext } from '../types/common.dto';
import { NotFoundError } from '../errors/AppError';

class PMScheduleService {
    async getAll(orgId: string, options: { asset_id?: string, skip: number, limit: number, search?: string, record_status?: string }): Promise<any> {
        return pmScheduleRepository.findAll(orgId, options);
    }

    async getById(pmId: string, orgId: string): Promise<any> {
        const pm = await pmScheduleRepository.findById(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');
        return pm;
    }

    async create(orgId: string, dto: any, audit: AuditContext): Promise<any> {
        const pm = await pmScheduleRepository.createWithAssociations({ ...dto, org_id: orgId });
        const fullyLoaded = await pmScheduleRepository.findByPkWithAsset(pm.id);

        auditService.log({ ...audit, entityType: 'PMSchedule', entityId: pm.id, action: 'create', newValues: { name: pm.name } });
        return fullyLoaded;
    }

    async update(pmId: string, orgId: string, dto: any): Promise<any> {
        const pm = await pmScheduleRepository.findById(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');

        await pmScheduleRepository.updateWithAssociations(pmId, orgId, dto);
        return pmScheduleRepository.findByPkWithAsset(pm.id);
    }

    async delete(pmId: string, orgId: string): Promise<{ message: string }> {
        const pm = await pmScheduleRepository.findByIdParanoid(pmId, orgId);
        if (!pm) throw new NotFoundError('PM schedule');

        if (pm.deleted_at === null && pm.is_active !== false) {
            await pmScheduleRepository.softDeleteWithTransaction(pm);
            return { message: 'PM schedule deactivated' };
        } else {
            await pmScheduleRepository.hardDelete(pm);
            return { message: 'PM schedule permanently deleted' };
        }
    }

    async bulkDelete(orgId: string, dto: any, audit: AuditContext): Promise<{ message: string }> {
        if (!dto.force) {
            await pmScheduleRepository.bulkSoftDelete(dto.ids, orgId);
        }
        const count = await pmScheduleRepository.bulkDelete(dto.ids, orgId, !!dto.force);
        auditService.log({ ...audit, entityType: 'PMSchedule', entityId: dto.ids[0], action: dto.force ? 'bulk_hard_delete' : 'bulk_delete', newValues: { count } });
        return { message: `${count} PM Schedules successfully ${dto.force ? 'permanently deleted' : 'deactivated'}.` };
    }
}

export const pmScheduleService = new PMScheduleService();
