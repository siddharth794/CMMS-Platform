import { Op } from 'sequelize';
import { Asset, sequelize } from '../models';

class AssetRepository {
    async findAndCountAll(orgId: string, where: any, paranoid: boolean, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        return Asset.findAndCountAll({
            where: { org_id: orgId, ...where },
            paranoid,
            offset: skip,
            limit
        });
    }

    async findById(assetId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: assetId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Asset.findOne({ where });
    }

    async findByIdParanoid(assetId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: assetId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Asset.findOne({ where, paranoid: false });
    }

    async create(data: Record<string, any>): Promise<any> {
        return Asset.create(data);
    }

    async bulkCreateWithTransaction(assets: Record<string, any>[]): Promise<any[]> {
        return sequelize.transaction(async (t) => {
            const results = [];
            for (const data of assets) {
                const asset = await Asset.create(data, { transaction: t });
                results.push(asset);
            }
            return results;
        });
    }

    async softDeleteWithTransaction(asset: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            asset.is_active = false;
            await asset.save({ transaction: t });
            await asset.destroy({ transaction: t });
        });
    }

    async hardDelete(asset: any): Promise<void> {
        await asset.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string): Promise<void> {
        await Asset.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: orgId } });
    }

    async bulkDelete(ids: string[], orgId: string, force: boolean): Promise<number> {
        return Asset.destroy({ where: { id: { [Op.in]: ids }, org_id: orgId }, force });
    }
}

export const assetRepository = new AssetRepository();
