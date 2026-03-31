import { Checklist, ChecklistItem, User, Asset, PMSchedule, WorkOrder, sequelize } from '../models';

const CHECKLIST_INCLUDES = [
    { model: ChecklistItem, as: 'items', required: false },
    { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    { model: Asset, as: 'asset', attributes: ['id', 'name', 'asset_tag'], required: false },
    { model: PMSchedule, as: 'pm_schedule', attributes: ['id', 'name'], required: false },
    { model: WorkOrder, as: 'work_order', attributes: ['id', 'wo_number', 'title'], required: false }
];

class ChecklistRepository {
    async findAndCountAll(where: any, skip: number, limit: number): Promise<{ rows: any[]; count: number }> {
        return Checklist.findAndCountAll({
            where,
            include: CHECKLIST_INCLUDES,
            offset: skip,
            limit: limit,
            order: [['created_at', 'DESC']],
            distinct: true
        });
    }

    async findById(id: string, orgId: string, transaction?: any): Promise<any> {
        return Checklist.findOne({
            where: { id, org_id: orgId },
            include: [
                ...CHECKLIST_INCLUDES,
                { 
                    model: ChecklistItem, 
                    as: 'items', 
                    required: false,
                    include: [{ model: User, as: 'completer', attributes: ['id', 'first_name', 'last_name'] }]
                }
            ],
            order: [[{ model: ChecklistItem, as: 'items' }, 'order_index', 'ASC']],
            transaction
        });
    }

    async findTemplatesByEntity(entityType: 'asset_id' | 'pm_schedule_id', entityId: string, orgId: string): Promise<any[]> {
        return Checklist.findAll({
            where: {
                org_id: orgId,
                is_template: true,
                [entityType]: entityId
            },
            include: [{ model: ChecklistItem, as: 'items', required: false }]
        });
    }

    async create(data: any, transaction?: any): Promise<any> {
        return Checklist.create(data, { transaction });
    }

    async update(id: string, orgId: string, data: any, transaction?: any): Promise<number> {
        const [affectedCount] = await Checklist.update(data, {
            where: { id, org_id: orgId },
            transaction
        });
        return affectedCount;
    }

    async delete(id: string, orgId: string): Promise<number> {
        return Checklist.destroy({
            where: { id, org_id: orgId }
        });
    }

    async createItem(data: any, transaction?: any): Promise<any> {
        return ChecklistItem.create(data, { transaction });
    }

    async bulkCreateItems(data: any[], transaction?: any): Promise<any[]> {
        return ChecklistItem.bulkCreate(data, { transaction });
    }

    async updateItem(id: string, checklistId: string, data: any, transaction?: any): Promise<number> {
        const [affectedCount] = await ChecklistItem.update(data, {
            where: { id, checklist_id: checklistId },
            transaction
        });
        return affectedCount;
    }

    async findItemById(id: string, checklistId: string): Promise<any> {
        return ChecklistItem.findOne({
            where: { id, checklist_id: checklistId }
        });
    }

    async deleteItem(id: string, checklistId: string): Promise<number> {
        return ChecklistItem.destroy({
            where: { id, checklist_id: checklistId }
        });
    }
}

export default new ChecklistRepository();
