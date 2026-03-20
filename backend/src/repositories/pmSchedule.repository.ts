import { Op } from 'sequelize';
import { PMSchedule, Asset, PMTrigger, PMTemplate, PMTask, PMPart, InventoryItem, sequelize } from '../models';

class PMScheduleRepository {
    async findAll(orgId: string | null, options: { asset_id?: string, site_id?: string, skip: number, limit: number, search?: string, record_status?: string }): Promise<any> {
        let where: any = {};
        if (orgId) where.org_id = orgId;
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
        if (options.site_id) where.site_id = options.site_id;
        
        if (options.search) {
            where.name = { [Op.like]: `%${options.search}%` };
        }

        const result = await PMSchedule.findAndCountAll({
            where,
            paranoid,
            include: [
                { model: Asset, as: 'asset' },
                { model: PMTrigger, as: 'triggers' },
                { model: PMTemplate, as: 'template' }
            ],
            offset: options.skip,
            limit: options.limit,
            distinct: true
        });

        return { data: result.rows, total: result.count, skip: options.skip, limit: options.limit };
    }

    async findById(pmId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: pmId, is_active: true };
        if (orgId) where.org_id = orgId;
        
        return PMSchedule.findOne({
            where,
            include: [
                { model: Asset, as: 'asset' },
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
                { model: Asset, as: 'asset' },
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

    async updateWithAssociations(pmId: string, orgId: string | null, data: Record<string, any>): Promise<any> {
        return sequelize.transaction(async (t) => {
            const where: any = { id: pmId };
            if (orgId) where.org_id = orgId;
            const pm = await PMSchedule.findOne({ where });
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

    async findByIdParanoid(pmId: string, orgId: string | null): Promise<any | null> {
        const where: any = { id: pmId };
        if (orgId) where.org_id = orgId;
        return PMSchedule.findOne({
            where,
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

    async restoreWithTransaction(pm: any): Promise<void> {
        await sequelize.transaction(async (t) => {
            await pm.restore({ transaction: t });
            pm.is_active = true;
            await pm.save({ transaction: t });
        });
    }

    async hardDelete(pm: any): Promise<void> {
        await pm.destroy({ force: true });
    }

    async bulkSoftDelete(ids: string[], orgId: string | null): Promise<void> {
        const where: any = { id: { [Op.in]: ids } };
        if (orgId) where.org_id = orgId;
        await PMSchedule.update({ is_active: false }, { where });
    }

    async bulkDelete(ids: string[], orgId: string | null, force: boolean): Promise<number> {
        const where: any = { id: { [Op.in]: ids } };
        if (orgId) where.org_id = orgId;
        return PMSchedule.destroy({ where, force });
    }
}

export const pmScheduleRepository = new PMScheduleRepository();
