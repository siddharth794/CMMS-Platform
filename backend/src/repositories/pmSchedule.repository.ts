import { Op } from 'sequelize';
import { PMSchedule, Asset, PMTrigger, PMTemplate, PMTask, PMPart, InventoryItem, sequelize } from '../models';

class PMScheduleRepository {
    async findAll(orgId: string, options: { asset_id?: string, skip: number, limit: number, search?: string, record_status?: string }): Promise<any> {
        let where: any = { org_id: orgId };
        let paranoid = true;

        if (options.record_status === 'inactive') {
            paranoid = false;
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        if (options.asset_id) where.asset_id = options.asset_id;
        
        if (options.search) {
            where.name = { [Op.like]: `%${options.search}%` };
        }

        const result = await PMSchedule.findAndCountAll({
            where,
            paranoid,
            include: [
                { model: Asset },
                { model: PMTrigger, as: 'triggers' },
                { model: PMTemplate, as: 'template' }
            ],
            offset: options.skip,
            limit: options.limit,
            distinct: true
        });

        return { data: result.rows, total: result.count, skip: options.skip, limit: options.limit };
    }

    async findById(pmId: string, orgId: string): Promise<any | null> {
        return PMSchedule.findOne({
            where: { id: pmId, org_id: orgId, is_active: true },
            include: [
                { model: Asset },
                { model: PMTrigger, as: 'triggers' },
                { model: PMTemplate, as: 'template' },
                { model: PMTask, as: 'tasks' },
                { model: PMPart, as: 'parts', include: [{ model: InventoryItem, as: 'item' }] }
            ]
        });
    }

    async findByPkWithAsset(pmId: string): Promise<any | null> {
        return PMSchedule.findByPk(pmId, { 
            include: [
                { model: Asset },
                { model: PMTrigger, as: 'triggers' },
                { model: PMTemplate, as: 'template' },
                { model: PMTask, as: 'tasks' },
                { model: PMPart, as: 'parts', include: [{ model: InventoryItem, as: 'item' }] }
            ] 
        });
    }

    async createWithAssociations(data: Record<string, any>): Promise<any> {
        return sequelize.transaction(async (t) => {
            const { triggers, template, tasks, parts, ...pmData } = data;
            
            const pm = await PMSchedule.create(pmData, { transaction: t });

            if (template) {
                await PMTemplate.create({ ...template, pm_schedule_id: pm.id }, { transaction: t });
            }

            if (triggers && triggers.length > 0) {
                const triggersData = triggers.map((tr: any) => ({ ...tr, pm_schedule_id: pm.id }));
                await PMTrigger.bulkCreate(triggersData, { transaction: t });
            }

            if (tasks && tasks.length > 0) {
                const tasksData = tasks.map((tk: any) => ({ ...tk, pm_schedule_id: pm.id }));
                await PMTask.bulkCreate(tasksData, { transaction: t });
            }

            if (parts && parts.length > 0) {
                const partsData = parts.map((pt: any) => ({ ...pt, pm_schedule_id: pm.id }));
                await PMPart.bulkCreate(partsData, { transaction: t });
            }

            return pm;
        });
    }

    async updateWithAssociations(pmId: string, orgId: string, data: Record<string, any>): Promise<any> {
        return sequelize.transaction(async (t) => {
            const pm = await PMSchedule.findOne({ where: { id: pmId, org_id: orgId } });
            if (!pm) return null;

            const { triggers, template, tasks, parts, ...pmData } = data;
            await pm.update(pmData, { transaction: t });

            if (template) {
                const existingTemplate = await PMTemplate.findOne({ where: { pm_schedule_id: pmId } });
                if (existingTemplate) {
                    await existingTemplate.update(template, { transaction: t });
                } else {
                    await PMTemplate.create({ ...template, pm_schedule_id: pmId }, { transaction: t });
                }
            }

            // For collections (triggers, tasks, parts) we replace them completely for simplicity.
            if (triggers) {
                await PMTrigger.destroy({ where: { pm_schedule_id: pmId }, transaction: t });
                const triggersData = triggers.map((tr: any) => ({ ...tr, pm_schedule_id: pmId }));
                await PMTrigger.bulkCreate(triggersData, { transaction: t });
            }

            if (tasks) {
                await PMTask.destroy({ where: { pm_schedule_id: pmId }, transaction: t });
                const tasksData = tasks.map((tk: any) => ({ ...tk, pm_schedule_id: pmId }));
                await PMTask.bulkCreate(tasksData, { transaction: t });
            }

            if (parts) {
                await PMPart.destroy({ where: { pm_schedule_id: pmId }, transaction: t });
                const partsData = parts.map((pt: any) => ({ ...pt, pm_schedule_id: pmId }));
                await PMPart.bulkCreate(partsData, { transaction: t });
            }

            return pm;
        });
    }

    async findByIdParanoid(pmId: string, orgId: string): Promise<any | null> {
        return PMSchedule.findOne({
            where: { id: pmId, org_id: orgId },
            paranoid: false
        });
    }

    async softDeleteWithTransaction(pm: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            pm.is_active = false;
            await pm.save({ transaction: t });
            await pm.destroy({ transaction: t });
        });
    }

    async hardDelete(pm: any): Promise<void> {
        await pm.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string): Promise<void> {
        await PMSchedule.update({ is_active: false }, { where: { id: { [Op.in]: ids }, org_id: orgId } });
    }

    async bulkDelete(ids: string[], orgId: string, force: boolean): Promise<number> {
        return PMSchedule.destroy({ where: { id: { [Op.in]: ids }, org_id: orgId }, force });
    }
}

export const pmScheduleRepository = new PMScheduleRepository();
