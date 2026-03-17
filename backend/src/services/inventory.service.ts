import { Op, literal } from 'sequelize';
import { inventoryRepository } from '../repositories/inventory.repository';
import { auditService } from './audit.service';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO, InventoryListQuery } from '../types/dto';
import { AuditContext, BulkDeleteDTO, PaginatedResponse } from '../types/common.dto';
import { NotFoundError } from '../errors/AppError';

class InventoryService {
    async getAll(orgId: string | null, query: InventoryListQuery): Promise<PaginatedResponse<any>> {
        const { skip = 0, limit = 100, search, category, low_stock_only, record_status } = query;
        let where: any = {};
        let paranoid = true;

        if (record_status === 'inactive') {
            paranoid = false;
            where[Op.or] = [
                { deleted_at: { [Op.not]: null } },
                { is_active: false }
            ];
        } else {
            where.is_active = true;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { sku: { [Op.like]: `%${search}%` } }
            ];
        }
        if (category) where.category = category;
        if (query.site_id) where.site_id = query.site_id;
        if (low_stock_only === 'true') {
            where.min_quantity = { [Op.gt]: 0 };
            where.quantity = { [Op.lte]: literal('`min_quantity`') };
        }

        const result = await inventoryRepository.findAndCountAll(orgId, where, paranoid, Number(skip), Number(limit));
        return { data: result.rows, total: result.count, skip: Number(skip), limit: Number(limit) };
    }

    async getStats(orgId: string | null, query?: any): Promise<{ total_items: number; low_stock_count: number; total_value: number }> {
        const where: any = { is_active: true };
        if (query?.site_id) where.site_id = query.site_id;

        const [total_items, low_stock_count, total_value] = await Promise.all([
            inventoryRepository.count(orgId, where),
            inventoryRepository.count(orgId, {
                ...where,
                min_quantity: { [Op.gt]: 0 },
                quantity: { [Op.lte]: literal('`min_quantity`') }
            }),
            inventoryRepository.sumTotalValue(orgId, query?.site_id)
        ]);
        return { total_items, low_stock_count, total_value };
    }

    async getCategories(orgId: string | null, siteId?: string): Promise<{ categories: string[] }> {
        const categories = await inventoryRepository.getDistinctCategories(orgId, siteId);
        return { categories };
    }

    async getById(itemId: string, orgId: string | null): Promise<any> {
        const item = await inventoryRepository.findById(itemId, orgId);
        if (!item) throw new NotFoundError('Inventory item');
        return item;
    }

    async create(orgId: string | null, dto: CreateInventoryItemDTO, audit: AuditContext): Promise<any> {
        const targetOrgId = dto.org_id || orgId;
        const item = await inventoryRepository.create({ ...dto, org_id: targetOrgId });
        auditService.log({ ...audit, entityType: 'InventoryItem', entityId: item.id, action: 'create', newValues: { name: item.name, org_id: targetOrgId, site_id: item.site_id } });
        return item;
    }

    async update(itemId: string, orgId: string | null, dto: UpdateInventoryItemDTO): Promise<any> {
        const item = await inventoryRepository.findById(itemId, orgId);
        if (!item) throw new NotFoundError('Inventory item');
        await item.update(dto);
        return item;
    }

    async delete(itemId: string, orgId: string | null, audit: AuditContext): Promise<{ message: string }> {
        const item = await inventoryRepository.findByIdParanoid(itemId, orgId);
        if (!item) throw new NotFoundError('Inventory item');

        if (item.deleted_at === null && item.is_active !== false) {
            await inventoryRepository.softDeleteWithTransaction(item);
            auditService.log({ ...audit, entityType: 'InventoryItem', entityId: item.id, action: 'delete' });
            return { message: 'Inventory item deactivated' };
        } else {
            await inventoryRepository.hardDelete(item);
            auditService.log({ ...audit, entityType: 'InventoryItem', entityId: item.id, action: 'hard_delete' });
            return { message: 'Inventory item permanently deleted' };
        }
    }

    async restore(itemId: string, orgId: string | null, audit: AuditContext): Promise<{ message: string }> {
        const item = await inventoryRepository.findByIdParanoid(itemId, orgId);
        if (!item) throw new NotFoundError('Inventory item');

        if (item.deleted_at !== null || item.is_active === false) {
            await inventoryRepository.restoreWithTransaction(item);
            auditService.log({ ...audit, entityType: 'InventoryItem', entityId: item.id, action: 'restore' });
            return { message: 'Inventory item restored successfully' };
        }
        
        return { message: 'Inventory item is already active' };
    }

    async bulkDelete(orgId: string | null, dto: BulkDeleteDTO, audit: AuditContext): Promise<{ message: string }> {
        if (!dto.force) await inventoryRepository.bulkSoftDelete(dto.ids, orgId);
        const count = await inventoryRepository.bulkDelete(dto.ids, orgId, !!dto.force);
        auditService.log({ ...audit, entityType: 'InventoryItem', entityId: dto.ids[0], action: dto.force ? 'bulk_hard_delete' : 'bulk_delete', newValues: { deleted_ids: dto.ids, count } });
        return { message: `${count} Inventory Items successfully ${dto.force ? 'permanently deleted' : 'deactivated'}.` };
    }

    async bulkRestore(orgId: string | null, ids: string[], audit: AuditContext): Promise<{ message: string }> {
        const count = await inventoryRepository.bulkRestore(ids, orgId);
        auditService.log({ ...audit, entityType: 'InventoryItem', entityId: ids[0], action: 'bulk_restore', newValues: { restored_ids: ids, count } });
        return { message: `${count} Inventory Items successfully restored.` };
    }
    async bulkCreate(orgId: string | null, items: any[], audit: AuditContext): Promise<{ count: number }> {
        let processedCount = 0;
        
        for (const dto of items) {
            const existingItem = await inventoryRepository.findBySkuOrName(orgId, dto.sku, dto.name);
            
            if (existingItem) {
                // If exists, increment quantity
                const newQuantity = Number(existingItem.quantity) + Number(dto.quantity || 0);
                await existingItem.update({ quantity: newQuantity });
                auditService.log({ 
                    ...audit, 
                    entityType: 'InventoryItem', 
                    entityId: existingItem.id, 
                    action: 'update', 
                    newValues: { quantity: newQuantity, note: 'Bulk imported quantity addition' } 
                });
            } else {
                // If it doesn't exist, create it
                const newItem = await inventoryRepository.create({ ...dto, org_id: orgId });
                auditService.log({ 
                    ...audit, 
                    entityType: 'InventoryItem', 
                    entityId: newItem.id, 
                    action: 'create', 
                    newValues: { name: newItem.name, org_id: orgId, site_id: newItem.site_id, note: 'Bulk imported' } 
                });
            }
            processedCount++;
        }
        
        return { count: processedCount };
    }
}

export const inventoryService = new InventoryService();
