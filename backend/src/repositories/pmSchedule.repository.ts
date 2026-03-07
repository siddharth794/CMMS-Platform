import { PMSchedule, Asset } from '../models';

class PMScheduleRepository {
    async findAll(orgId: string, assetId: string | undefined, skip: number, limit: number): Promise<any[]> {
        const where: any = { org_id: orgId, is_active: true };
        if (assetId) where.asset_id = assetId;

        return PMSchedule.findAll({
            where,
            include: [{ model: Asset }],
            offset: skip,
            limit
        });
    }

    async findById(pmId: string, orgId: string): Promise<any | null> {
        return PMSchedule.findOne({
            where: { id: pmId, org_id: orgId },
            include: [{ model: Asset }]
        });
    }

    async findByPkWithAsset(pmId: string): Promise<any | null> {
        return PMSchedule.findByPk(pmId, { include: [{ model: Asset }] });
    }

    async create(data: Record<string, any>): Promise<any> {
        return PMSchedule.create(data);
    }
}

export const pmScheduleRepository = new PMScheduleRepository();
