import { Op, fn, col, literal } from 'sequelize';
import { InventoryItem, Site, Organization, sequelize } from '../models';

class InventoryRepository {
    async findAndCountAll(orgId: string | null, where: any, paranoid: boolean, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        const finalWhere = orgId ? { org_id: orgId, ...where } : { ...where };
        return InventoryItem.findAndCountAll({
            where: finalWhere,
            include: [
                { model: Site, as: 'site', attributes: ['id', 'name'] },
                { model: Organization, as: 'org', attributes: ['id', 'name'] }
            ],
            paranoid,
            offset: skip,
            limit
        });
    }

    async findById(itemId: string, orgId: string | null): Promise<any | null> {
        const where = orgId ? { id: itemId, org_id: orgId } : { id: itemId };
        return InventoryItem.findOne({ 
            where,
            include: [
                { model: Site, as: 'site', attributes: ['id', 'name'] },
                { model: Organization, as: 'org', attributes: ['id', 'name'] }
            ]
        });
    }

    async findByIdParanoid(itemId: string, orgId: string | null): Promise<any | null> {
        const where = orgId ? { id: itemId, org_id: orgId } : { id: itemId };
        return InventoryItem.findOne({ where, paranoid: false });
    }

    async findBySkuOrName(orgId: string | null, sku: string | null | undefined, name: string): Promise<any | null> {
        let where: any = {};
        if (orgId) where.org_id = orgId;
        
        if (sku) {
            where[Op.or] = [
                { sku: sku },
                { name: name }
            ];
        } else {
            where.name = name;
        }

        return InventoryItem.findOne({ where });
    }

    async count(orgId: string | null, where: any = {}): Promise<number> {
        const finalWhere = orgId ? { org_id: orgId, ...where } : { ...where };
        return InventoryItem.count({ where: finalWhere });
    }

    async sumTotalValue(orgId: string | null, siteId?: string): Promise<number> {
        const where: any = { is_active: true };
        if (orgId) where.org_id = orgId;
        if (siteId) where.site_id = siteId;

        const result: any = await InventoryItem.findOne({
            attributes: [[fn('SUM', literal('quantity * CAST(unit_cost AS DECIMAL(10,2))')), 'total_value']],
            where,
            raw: true
        });
        return parseFloat(result?.total_value) || 0;
    }

    async getDistinctCategories(orgId: string | null, siteId?: string): Promise<string[]> {
        const where: any = { is_active: true };
        if (orgId) where.org_id = orgId;
        if (siteId) where.site_id = siteId;

        const items = await InventoryItem.findAll({
            attributes: ['category'],
            where,
            group: ['category']
        });
        return items.map((item: any) => item.category).filter(Boolean);
    }

    async create(data: Record<string, any>): Promise<any> {
        return InventoryItem.create(data);
    }

    async softDeleteWithTransaction(item: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            item.is_active = false;
            await item.save({ transaction: t });
            await item.destroy({ transaction: t });
        });
    }

    async restoreWithTransaction(item: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            await item.restore({ transaction: t });
            item.is_active = true;
            await item.save({ transaction: t });
        });
    }

    async hardDelete(item: any): Promise<void> {
        await item.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string | null): Promise<void> {
        const where = orgId ? { id: { [Op.in]: ids }, org_id: orgId } : { id: { [Op.in]: ids } };
        await InventoryItem.update({ is_active: false }, { where });
    }

    async bulkDelete(ids: string[], orgId: string | null, force: boolean): Promise<number> {
        const where = orgId ? { id: { [Op.in]: ids }, org_id: orgId } : { id: { [Op.in]: ids } };
        return InventoryItem.destroy({ where, force });
    }

    async bulkRestore(ids: string[], orgId: string | null): Promise<number> {
        const where = orgId ? { id: { [Op.in]: ids }, org_id: orgId } : { id: { [Op.in]: ids } };
        const items = await InventoryItem.findAll({
            where,
            paranoid: false
        });
        
        let restoredCount = 0;
        await sequelize.transaction(async (t) => {
            for (const item of items) {
                if (item.deleted_at !== null || item.is_active === false) {
                    await item.restore({ transaction: t });
                    item.is_active = true;
                    await item.save({ transaction: t });
                    restoredCount++;
                }
            }
        });
        return restoredCount;
    }
}

export const inventoryRepository = new InventoryRepository();
