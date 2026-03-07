import { Op } from 'sequelize';
import { WorkOrder, Asset, User, Role, WorkOrderInventoryItem, InventoryItem, WOAttachment, sequelize } from '../models';

const WO_INCLUDES = [
    { model: Asset, paranoid: false },
    { model: User, as: 'assignee', required: false, paranoid: false, include: [{ model: Role, required: false }] },
    { model: User, as: 'requester', required: false, paranoid: false, include: [{ model: Role, required: false }] },
    { model: WorkOrderInventoryItem, as: 'used_parts', required: false, include: [{ model: InventoryItem, as: 'item', required: false }] },
    { model: WOAttachment, as: 'attachments', required: false }
];

const WO_INCLUDES_STRICT = [
    { model: Asset },
    { model: User, as: 'assignee', include: [{ model: Role }] },
    { model: User, as: 'requester', include: [{ model: Role }] },
    { model: WorkOrderInventoryItem, as: 'used_parts', include: [{ model: InventoryItem, as: 'item' }] },
    { model: WOAttachment, as: 'attachments' }
];

class WorkOrderRepository {
    async findAndCountAll(where: any, paranoid: boolean, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        return WorkOrder.findAndCountAll({
            where,
            paranoid,
            include: WO_INCLUDES,
            order: [['created_at', 'DESC']],
            offset: skip,
            limit,
            distinct: true
        });
    }

    async findByPkFull(woId: string): Promise<any | null> {
        return WorkOrder.findByPk(woId, { include: WO_INCLUDES_STRICT });
    }

    async findByIdAndOrg(woId: string, orgId: string): Promise<any | null> {
        return WorkOrder.findOne({ where: { id: woId, org_id: orgId } });
    }

    async findByIdAndOrgFull(woId: string, orgId: string): Promise<any | null> {
        return WorkOrder.findOne({
            where: { id: woId, org_id: orgId },
            include: WO_INCLUDES_STRICT
        });
    }

    async findByIdParanoid(woId: string, orgId: string): Promise<any | null> {
        return WorkOrder.findOne({ where: { id: woId, org_id: orgId }, paranoid: false });
    }

    async create(data: Record<string, any>): Promise<any> {
        return WorkOrder.create(data);
    }

    async softDelete(wo: any): Promise<void> {
        await wo.destroy();
    }

    async hardDelete(wo: any): Promise<void> {
        await wo.destroy({ force: true });
    }

    async bulkDelete(ids: string[], orgId: string, force: boolean): Promise<number> {
        return WorkOrder.destroy({ where: { id: { [Op.in]: ids }, org_id: orgId }, force });
    }

    async countAttachments(woId: string): Promise<number> {
        return WOAttachment.count({ where: { work_order_id: woId } });
    }

    // ─── Comments ─────────────────────────────────────────────────
    async findComments(woId: string): Promise<any[]> {
        const { WOComment } = require('../models');
        return WOComment.findAll({
            where: { work_order_id: woId },
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'], include: [{ model: Role, attributes: ['name'] }] }],
            order: [['created_at', 'ASC']]
        });
    }

    async createComment(data: Record<string, any>): Promise<any> {
        const { WOComment } = require('../models');
        const comment = await WOComment.create(data);
        return WOComment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'], include: [{ model: Role, attributes: ['name'] }] }]
        });
    }

    // ─── Inventory Usage ──────────────────────────────────────────
    async findUsedParts(woId: string): Promise<any[]> {
        return WorkOrderInventoryItem.findAll({
            where: { work_order_id: woId },
            include: [{ model: InventoryItem, as: 'item' }],
            order: [['created_at', 'ASC']]
        });
    }

    async addInventoryUsage(woId: string, inventoryItemId: string, quantityUsed: number, orgId: string): Promise<any> {
        return sequelize.transaction(async (t) => {
            const item: any = await InventoryItem.findOne({
                where: { id: inventoryItemId, org_id: orgId },
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if (!item) throw new Error('Inventory item not found');
            if (item.quantity < quantityUsed) throw new Error(`Not enough stock. Only ${item.quantity} available.`);

            item.quantity -= quantityUsed;
            await item.save({ transaction: t });

            const usage: any = await WorkOrderInventoryItem.create(
                { work_order_id: woId, inventory_item_id: inventoryItemId, quantity_used: quantityUsed },
                { transaction: t }
            );

            return WorkOrderInventoryItem.findByPk(usage.id, {
                include: [{ model: InventoryItem, as: 'item' }],
                transaction: t
            });
        });
    }

    async removeInventoryUsage(usageId: string, woId: string): Promise<void> {
        await sequelize.transaction(async (t) => {
            const usage: any = await WorkOrderInventoryItem.findOne({
                where: { id: usageId, work_order_id: woId },
                transaction: t
            });
            if (!usage) throw new Error('Usage record not found');

            const item: any = await InventoryItem.findOne({
                where: { id: usage.inventory_item_id },
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if (item) {
                item.quantity += usage.quantity_used;
                await item.save({ transaction: t });
            }
            await usage.destroy({ transaction: t });
        });
    }

    // ─── Attachments ──────────────────────────────────────────────
    async createAttachments(woId: string, filenames: string[]): Promise<any[]> {
        return sequelize.transaction(async (t) => {
            const results = [];
            for (const filename of filenames) {
                const attachment = await WOAttachment.create(
                    { work_order_id: woId, file_path: `/uploads/work-orders/${filename}` },
                    { transaction: t }
                );
                results.push(attachment);
            }
            return results;
        });
    }
}

export const workOrderRepository = new WorkOrderRepository();
