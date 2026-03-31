import { Op } from 'sequelize';
import checklistRepository from '../repositories/checklist.repository';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { sequelize } from '../models';

class ChecklistService {
    async createChecklist(orgId: string, userId: string, data: any) {
        return sequelize.transaction(async (t) => {
            const { items, asset_id, pm_schedule_id, ...checklistData } = data;
            
            // Filter out null/undefined values for optional foreign keys
            const createData: any = {
                ...checklistData,
                org_id: orgId,
                created_by: userId
            };
            
            if (asset_id) {
                createData.asset_id = asset_id;
            }
            if (pm_schedule_id) {
                createData.pm_schedule_id = pm_schedule_id;
            }
            
            const checklist = await checklistRepository.create(createData, t);

            if (items && items.length > 0) {
                const itemsToCreate = items.map((item: any, index: number) => ({
                    ...item,
                    checklist_id: checklist.id,
                    order_index: item.order_index ?? index
                }));
                await checklistRepository.bulkCreateItems(itemsToCreate, t);
            }

            return checklistRepository.findById(checklist.id, orgId, t);
        });
    }

    async getChecklists(orgId: string, query: any) {
        const { skip = 0, limit = 10, search, asset_id, pm_schedule_id, work_order_id, is_template, record_status } = query;
        
        const where: any = { org_id: orgId };
        if (search) where.name = { [Op.like]: `%${search}%` };
        if (asset_id) where.asset_id = asset_id;
        if (pm_schedule_id) where.pm_schedule_id = pm_schedule_id;
        if (work_order_id) where.work_order_id = work_order_id;
        if (is_template !== undefined) where.is_template = is_template === 'true';

        let paranoid = true;
        if (record_status === 'inactive') {
            paranoid = false;
            where.deleted_at = { [Op.not]: null };
        }

        const result = await checklistRepository.findAndCountAll(where, Number(skip), Number(limit), paranoid);
        return { data: result.rows, total: result.count, skip: Number(skip), limit: Number(limit) };
    }

    async getChecklistById(id: string, orgId: string) {
        const checklist = await checklistRepository.findById(id, orgId, undefined, false);
        if (!checklist) throw new NotFoundError('Checklist not found');
        return checklist;
    }

    async updateChecklist(id: string, orgId: string, data: any) {
        const checklist = await this.getChecklistById(id, orgId);
        await checklistRepository.update(id, orgId, data);
        return this.getChecklistById(id, orgId);
    }

    async deleteChecklist(id: string, orgId: string, force: boolean = false) {
        const checklist = await this.getChecklistById(id, orgId);
        
        if (force || checklist.deleted_at !== null) {
            await checklistRepository.delete(id, orgId, true);
            return { message: 'Checklist permanently deleted' };
        }
        
        await checklistRepository.delete(id, orgId);
        return { message: 'Checklist deactivated (soft delete)' };
    }

    async bulkDeleteChecklists(ids: string[], orgId: string, force: boolean = false) {
        let deletedCount = 0;
        for (const id of ids) {
            const checklist = await checklistRepository.findById(id, orgId, undefined, false);
            if (checklist) {
                 if (force || checklist.deleted_at !== null) {
                     await checklistRepository.delete(id, orgId, true);
                 } else {
                     await checklistRepository.delete(id, orgId);
                 }
                 deletedCount++;
            }
        }
        return deletedCount;
    }

    async restoreChecklist(id: string, orgId: string) {
        const checklist = await this.getChecklistById(id, orgId);
        if (checklist.deleted_at !== null) {
            await checklistRepository.restore(id, orgId);
            return { message: 'Checklist restored successfully' };
        }
        return { message: 'Checklist is already active' };
    }

    async addChecklistItem(checklistId: string, orgId: string, data: any) {
        const checklist = await this.getChecklistById(checklistId, orgId);
        await checklistRepository.createItem({
            ...data,
            checklist_id: checklist.id
        });
        return this.getChecklistById(checklistId, orgId);
    }

    async updateChecklistItem(checklistId: string, itemId: string, orgId: string, data: any) {
        const checklist = await this.getChecklistById(checklistId, orgId);
        const item = await checklistRepository.findItemById(itemId, checklist.id);
        if (!item) throw new NotFoundError('Checklist item not found');

        await checklistRepository.updateItem(itemId, checklist.id, data);
        return this.getChecklistById(checklistId, orgId);
    }

    async toggleChecklistItem(checklistId: string, itemId: string, orgId: string, userId: string, isCompleted: boolean) {
        const checklist = await this.getChecklistById(checklistId, orgId);
        const item = await checklistRepository.findItemById(itemId, checklist.id);
        if (!item) throw new NotFoundError('Checklist item not found');

        await checklistRepository.updateItem(itemId, checklist.id, {
            is_completed: isCompleted,
            completed_by: isCompleted ? userId : null,
            completed_at: isCompleted ? new Date() : null
        });

        return this.getChecklistById(checklistId, orgId);
    }

    async deleteChecklistItem(checklistId: string, itemId: string, orgId: string) {
        const checklist = await this.getChecklistById(checklistId, orgId);
        await checklistRepository.deleteItem(itemId, checklist.id);
        return true;
    }

    /**
     * Clones a template checklist and attaches it to a work order.
     */
    async cloneChecklistForWorkOrder(templateId: string, workOrderId: string, orgId: string, transaction?: any) {
        const template = await checklistRepository.findById(templateId, orgId, transaction);
        if (!template) throw new NotFoundError(`Checklist template ${templateId} not found`);

        const newChecklist = await checklistRepository.create({
            org_id: orgId,
            name: template.name,
            description: template.description,
            is_template: false,
            is_required: template.is_required,
            work_order_id: workOrderId,
            created_by: template.created_by // Retain original creator or use system?
        }, transaction);

        if (template.items && template.items.length > 0) {
            const newItems = template.items.map((item: any) => ({
                checklist_id: newChecklist.id,
                description: item.description,
                order_index: item.order_index,
                is_completed: false
            }));
            await checklistRepository.bulkCreateItems(newItems, transaction);
        }

        return newChecklist;
    }

    async autoAssignChecklistsToWorkOrder(workOrder: any, transaction?: any) {
        // Find templates for the asset
        if (workOrder.asset_id) {
            const assetTemplates = await checklistRepository.findTemplatesByEntity('asset_id', workOrder.asset_id, workOrder.org_id);
            for (const template of assetTemplates) {
                await this.cloneChecklistForWorkOrder(template.id, workOrder.id, workOrder.org_id, transaction);
            }
        }

        // Find templates for the PM schedule
        // Currently, PM Schedule triggers work orders. If we have a link to PM template here, we clone it.
        // Assuming the WO has `pm_schedule_id` or `is_pm_generated` flag.
        // If your workOrder model doesn't store pm_schedule_id, you might need to fetch the PM execution or similar.
    }

    async checkRequiredChecklistsComplete(workOrderId: string, orgId: string) {
        const { rows: checklists } = await checklistRepository.findAndCountAll({ work_order_id: workOrderId, org_id: orgId }, 0, 1000);
        
        for (const checklist of checklists) {
            if (checklist.is_required) {
                const incompleteItems = checklist.items.filter((item: any) => !item.is_completed);
                if (incompleteItems.length > 0) {
                    throw new BadRequestError(`Please complete all items in the required checklist: ${checklist.name}`);
                }
            }
        }
    }
}

export default new ChecklistService();
