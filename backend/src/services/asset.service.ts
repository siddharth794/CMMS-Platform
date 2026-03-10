import { Op } from 'sequelize';
import { assetRepository } from '../repositories/asset.repository';
import { auditService } from './audit.service';
import { CreateAssetDTO, UpdateAssetDTO, AssetListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO, PaginatedResponse } from '../types/common.dto';
import { NotFoundError } from '../errors/AppError';

function generateAssetTag(): string {
    return 'AST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

class AssetService {
    async getAll(orgId: string, query: AssetListQuery): Promise<PaginatedResponse<any>> {
        const { skip = 0, limit = 100, search, asset_type, status, record_status } = query;
        let where: any = {};
        let paranoid = true;

        if (record_status === 'inactive') {
            paranoid = false;
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
                { asset_tag: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }
        if (asset_type) where.asset_type = asset_type;
        if (status) where.status = status;

        const result = await assetRepository.findAndCountAll(orgId, where, paranoid, Number(skip), Number(limit));
        return { data: result.rows, total: result.count, skip: Number(skip), limit: Number(limit) };
    }

    async getById(assetId: string, orgId: string | null): Promise<any> {
        const asset = await assetRepository.findById(assetId, orgId);
        if (!asset) throw new NotFoundError('Asset');
        return asset;
    }

    async create(orgId: string, dto: CreateAssetDTO, audit: AuditContext): Promise<any> {
        const data: any = { ...dto, org_id: orgId };
        if (!data.asset_tag) data.asset_tag = generateAssetTag();

        const asset = await assetRepository.create(data);

        auditService.log({ ...audit, entityType: 'Asset', entityId: asset.id, action: 'create', newValues: { name: asset.name } });
        return asset;
    }

    async bulkCreate(orgId: string, assets: Record<string, any>[]): Promise<any[]> {
        const prepared = assets.map((a: any) => {
            const data: any = { ...a, org_id: orgId };
            if (!data.asset_tag) data.asset_tag = generateAssetTag();
            return data;
        });
        return assetRepository.bulkCreateWithTransaction(prepared);
    }

    async update(assetId: string, orgId: string | null, dto: UpdateAssetDTO, audit: AuditContext): Promise<any> {
        const asset = await assetRepository.findById(assetId, orgId);
        if (!asset) throw new NotFoundError('Asset');

        const oldValues = { name: asset.name, status: asset.status };
        await asset.update(dto);

        auditService.log({ ...audit, entityType: 'Asset', entityId: asset.id, action: 'update', oldValues, newValues: dto as any });
        return asset;
    }

    async delete(assetId: string, orgId: string | null, audit: AuditContext): Promise<{ message: string }> {
        const asset = await assetRepository.findByIdParanoid(assetId, orgId);
        if (!asset) throw new NotFoundError('Asset');

        if (asset.deleted_at === null && asset.is_active !== false) {
            await assetRepository.softDeleteWithTransaction(asset);
            auditService.log({ ...audit, entityType: 'Asset', entityId: asset.id, action: 'delete' });
            return { message: 'Asset deactivated' };
        } else {
            await assetRepository.hardDelete(asset);
            auditService.log({ ...audit, entityType: 'Asset', entityId: asset.id, action: 'hard_delete' });
            return { message: 'Asset permanently deleted' };
        }
    }

    async bulkDelete(orgId: string, dto: BulkDeleteDTO, audit: AuditContext): Promise<{ message: string }> {
        if (!dto.force) await assetRepository.bulkSoftDelete(dto.ids, orgId);
        const count = await assetRepository.bulkDelete(dto.ids, orgId, !!dto.force);

        auditService.log({ ...audit, entityType: 'Asset', entityId: dto.ids[0], action: dto.force ? 'bulk_hard_delete' : 'bulk_delete', newValues: { deleted_ids: dto.ids, count } });
        return { message: `${count} Assets successfully ${dto.force ? 'permanently deleted' : 'deactivated'}.` };
    }
}

export const assetService = new AssetService();
