import { Op } from 'sequelize';
import { Asset, Site, sequelize } from '../models';

class AssetRepository {
    async findAndCountAll(orgId: string | null, where: any, paranoid: boolean, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        const queryWhere: any = { ...where };
        if (orgId) {
            queryWhere.org_id = orgId;
        }
        return Asset.findAndCountAll({
            where: queryWhere,
            paranoid,
            include: [{ model: Site, as: 'site', required: false }],
            offset: skip,
            limit
        });
    }

    async findById(assetId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: assetId };
        if (orgId !== null) {
            where.org_id = orgId;
        }
        return Asset.findOne({ 
            where,
            include: [{ model: Site, as: 'site', required: false }]
        });
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

    async restoreWithTransaction(asset: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            await asset.restore({ transaction: t });
            asset.is_active = true;
            await asset.save({ transaction: t });
        });
    }

    async hardDelete(asset: any): Promise<void> {
        await asset.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string | null): Promise<void> {
        const where: any = { id: { [Op.in]: ids } };
        if (orgId) {
            where.org_id = orgId;
        }
        await Asset.update({ is_active: false }, { where });
    }

    async bulkDelete(ids: string[], orgId: string | null, force: boolean): Promise<number> {
        const where: any = { id: { [Op.in]: ids } };
        if (orgId) {
            where.org_id = orgId;
        }
        return Asset.destroy({ where, force });
    }
}

export const assetRepository = new AssetRepository();
