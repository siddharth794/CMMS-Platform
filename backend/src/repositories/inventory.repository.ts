import { Op, fn, col, literal } from 'sequelize';
import { InventoryItem, sequelize } from '../models';

class InventoryRepository {
    async findAndCountAll(orgId: string, where: any, paranoid: boolean, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        return InventoryItem.findAndCountAll({
            where: { org_id: orgId, ...where },
            paranoid,
            offset: skip,
            limit
        });
    }

    async findById(itemId: string, orgId: string): Promise<any | null> {
        return InventoryItem.findOne({ where: { id: itemId, org_id: orgId } });
    }

    async findByIdParanoid(itemId: string, orgId: string): Promise<any | null> {
        return InventoryItem.findOne({ where: { id: itemId, org_id: orgId }, paranoid: false });
    }

    async count(orgId: string, where: any = {}): Promise<number> {
        return InventoryItem.count({ where: { org_id: orgId, ...where } });
    }

    async sumTotalValue(orgId: string): Promise<number> {
        const result: any = await InventoryItem.findOne({
            attributes: [[fn('SUM', literal('quantity * CAST(unit_cost AS DECIMAL(10,2))')), 'total_value']],
            where: { org_id: orgId, is_active: true },
            raw: true
        });
        return parseFloat(result?.total_value) || 0;
    }

    async getDistinctCategories(orgId: string): Promise<string[]> {
        const items = await InventoryItem.findAll({
            attributes: ['category'],
            where: { org_id: orgId, is_active: true },
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

    async hardDelete(item: any): Promise<void> {
        await item.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string): Promise<void> {
        await InventoryItem.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: orgId } });
    }

    async bulkDelete(ids: string[], orgId: string, force: boolean): Promise<number> {
        return InventoryItem.destroy({ where: { id: { [Op.in]: ids }, org_id: orgId }, force });
    }
}

export const inventoryRepository = new InventoryRepository();
