import { Op, fn, col, literal, QueryTypes } from 'sequelize';
import { WorkOrder, Asset, PMSchedule, PMExecution, InventoryItem, WorkOrderInventoryItem, User, Role, Site, AuditLog, sequelize } from '../models';

interface DateFilter {
    startDate?: Date;
    endDate?: Date;
}

function applyDateFilter(where: any, filter?: DateFilter, dateField: string = 'created_at'): any {
    if (filter?.startDate || filter?.endDate) {
        const dateCondition: any = {};
        if (filter.startDate) dateCondition[Op.gte] = filter.startDate;
        if (filter.endDate) dateCondition[Op.lte] = filter.endDate;
        where[dateField] = dateCondition;
    }
    return where;
}

function buildOrgWhere(orgId: string | null, extra: any = {}): any {
    return orgId ? { org_id: orgId, ...extra } : { ...extra };
}

class AnalyticsRepository {

    // ─── EXISTING ───────────────────────────────────────────

    async getDashboardCounts(orgId: string | null, dateFilter?: DateFilter): Promise<{
        totalWorkOrders: number;
        completedWorkOrders: number;
        pendingWorkOrders: number;
        inProgressWorkOrders: number;
        totalAssets: number;
        activePmSchedules: number;
        overduePms: number;
    }> {
        const whereOrg = orgId ? { org_id: orgId } : {};
        const baseWhere = applyDateFilter({ ...whereOrg }, dateFilter);

        const [
            totalWorkOrders, completedWorkOrders, pendingWorkOrders,
            inProgressWorkOrders, totalAssets, activePmSchedules, overduePms
        ] = await Promise.all([
            WorkOrder.count({ where: baseWhere }),
            WorkOrder.count({ where: { ...baseWhere, status: 'completed' } }),
            WorkOrder.count({ where: { ...baseWhere, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({ where: { ...baseWhere, status: 'in_progress' } }),
            Asset.count({ where: { ...whereOrg, is_active: true } }),
            PMSchedule.count({ where: { ...whereOrg, is_active: true } }),
            Promise.resolve(0)
        ]);
        return { totalWorkOrders, completedWorkOrders, pendingWorkOrders, inProgressWorkOrders, totalAssets, activePmSchedules, overduePms };
    }

    async getWoByStatusGrouped(orgId: string | null, assigneeId?: string, dateFilter?: DateFilter): Promise<any[]> {
        const whereOrg = orgId ? { org_id: orgId } : {};
        const where: any = applyDateFilter({ ...whereOrg }, dateFilter);
        if (assigneeId) where.assignee_id = assigneeId;
        return WorkOrder.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], where, group: ['status'], raw: true });
    }

    async getWoByPriorityGrouped(orgId: string | null, assigneeId?: string, dateFilter?: DateFilter): Promise<any[]> {
        const whereOrg = orgId ? { org_id: orgId } : {};
        const where: any = applyDateFilter({ ...whereOrg }, dateFilter);
        if (assigneeId) where.assignee_id = assigneeId;
        return WorkOrder.findAll({ attributes: ['priority', [fn('COUNT', col('id')), 'count']], where, group: ['priority'], raw: true });
    }

    async getRecentWorkOrders(orgId: string | null, assigneeId?: string, dateFilter?: DateFilter): Promise<any[]> {
        const whereOrg = orgId ? { org_id: orgId } : {};
        const where: any = applyDateFilter({ ...whereOrg }, dateFilter);
        if (assigneeId) where.assignee_id = assigneeId;
        return WorkOrder.findAll({
            where,
            include: [
                { model: Asset, as: 'asset' },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });
    }

    async getTechnicianCounts(orgId: string | null, userId: string, dateFilter?: DateFilter): Promise<{
        myAssigned: number; myCompleted: number; myInProgress: number; myPending: number; myOverdue: number;
    }> {
        const whereOrg = orgId ? { org_id: orgId } : {};
        const baseWhere = applyDateFilter({ ...whereOrg, assignee_id: userId }, dateFilter);

        const [myAssigned, myCompleted, myInProgress, myPending, myOverdue] = await Promise.all([
            WorkOrder.count({ where: baseWhere }),
            WorkOrder.count({ where: { ...baseWhere, status: 'completed' } }),
            WorkOrder.count({ where: { ...baseWhere, status: 'in_progress' } }),
            WorkOrder.count({ where: { ...baseWhere, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({ where: { ...baseWhere, status: { [Op.notIn]: ['completed', 'cancelled'] }, scheduled_end: { [Op.lt]: new Date(), [Op.ne]: null as any } } })
        ]);
        return { myAssigned, myCompleted, myInProgress, myPending, myOverdue };
    }

    // ─── WORK ORDER ANALYTICS ───────────────────────────────

    async getWoTrend(orgId: string | null, months: number = 12, siteId?: string): Promise<any[]> {
        const baseWhere: any = orgId ? { org_id: orgId } : {};
        if (siteId) baseWhere.site_id = siteId;

        const results = await sequelize.query(`
            SELECT
                DATE_FORMAT(wo_created.created_at, '%Y-%m') AS month,
                wo_created.created_count,
                COALESCE(wo_completed.completed_count, 0) AS completed_count
            FROM (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key,
                       DATE_FORMAT(created_at, '%Y-%m') AS created_at,
                       COUNT(*) AS created_count
                FROM work_orders
                WHERE deleted_at IS NULL
                  ${orgId ? `AND org_id = :orgId` : ''}
                  ${siteId ? `AND site_id = :siteId` : ''}
                  AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ) wo_created
            LEFT JOIN (
                SELECT DATE_FORMAT(actual_end, '%Y-%m') AS month_key,
                       COUNT(*) AS completed_count
                FROM work_orders
                WHERE deleted_at IS NULL
                  AND status = 'completed'
                  AND actual_end IS NOT NULL
                  ${orgId ? `AND org_id = :orgId` : ''}
                  ${siteId ? `AND site_id = :siteId` : ''}
                  AND actual_end >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
                GROUP BY DATE_FORMAT(actual_end, '%Y-%m')
            ) wo_completed ON wo_created.month_key = wo_completed.month_key
            ORDER BY month ASC
        `, {
            replacements: { orgId, siteId, months },
            type: QueryTypes.SELECT
        });

        return results;
    }

    async getWoBySite(orgId: string | null, dateFilter?: DateFilter): Promise<any[]> {
        const where: any = applyDateFilter(orgId ? { org_id: orgId } : {}, dateFilter);
        return WorkOrder.findAll({
            attributes: ['site_id', [fn('COUNT', col('WorkOrder.id')), 'count']],
            where,
            include: [{ model: Site, as: 'site', attributes: ['name'] }],
            group: ['site_id', 'site.id', 'site.name'],
            raw: true,
            nest: true
        });
    }

    async getWoByAssetCategory(orgId: string | null, dateFilter?: DateFilter): Promise<any[]> {
        const where: any = applyDateFilter(orgId ? { org_id: orgId } : {}, dateFilter);
        where.asset_id = { [Op.ne]: null };
        return WorkOrder.findAll({
            attributes: [[col('asset.category'), 'category'], [fn('COUNT', col('WorkOrder.id')), 'count']],
            where,
            include: [{ model: Asset, as: 'asset', attributes: [] }],
            group: ['asset.category'],
            raw: true
        });
    }

    async getTopAssetsByWOCount(orgId: string | null, limit: number = 10, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;
        where.asset_id = { [Op.ne]: null };
        return WorkOrder.findAll({
            attributes: ['asset_id', [fn('COUNT', col('WorkOrder.id')), 'wo_count']],
            where,
            include: [{ model: Asset, as: 'asset', attributes: ['name', 'asset_tag', 'category'] }],
            group: ['asset_id', 'asset.id', 'asset.name', 'asset.asset_tag', 'asset.category'],
            order: [[literal('wo_count'), 'DESC']],
            limit,
            raw: true,
            nest: true
        });
    }

    async getWoByDayOfWeek(orgId: string | null, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;
        return WorkOrder.findAll({
            attributes: [
                [fn('DAYOFWEEK', col('created_at')), 'day_of_week'],
                [fn('COUNT', col('id')), 'count']
            ],
            where,
            group: [fn('DAYOFWEEK', col('created_at'))],
            order: [[fn('DAYOFWEEK', col('created_at')), 'ASC']],
            raw: true
        });
    }

    async getPreventiveVsReactive(orgId: string | null, siteId?: string, dateFilter?: DateFilter): Promise<{ preventive: number; reactive: number }> {
        const baseWhere: any = orgId ? { org_id: orgId } : {};
        if (siteId) baseWhere.site_id = siteId;
        const where = applyDateFilter({ ...baseWhere }, dateFilter);

        const [preventive, reactive] = await Promise.all([
            WorkOrder.count({ where: { ...where, is_pm_generated: true } }),
            WorkOrder.count({ where: { ...where, is_pm_generated: false } })
        ]);
        return { preventive, reactive };
    }

    async getOverdueTrend(orgId: string | null, months: number = 6, siteId?: string): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT
                DATE_FORMAT(scheduled_end, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM work_orders
            WHERE deleted_at IS NULL
              AND status NOT IN ('completed', 'cancelled')
              AND scheduled_end IS NOT NULL
              AND scheduled_end < NOW()
              ${orgId ? `AND org_id = :orgId` : ''}
              ${siteId ? `AND site_id = :siteId` : ''}
              AND scheduled_end >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
            GROUP BY DATE_FORMAT(scheduled_end, '%Y-%m')
            ORDER BY month ASC
        `, {
            replacements: { orgId, siteId, months },
            type: QueryTypes.SELECT
        });
        return results;
    }

    async getEstimatedVsActual(orgId: string | null, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;
        where.status = 'completed';
        where.estimated_hours = { [Op.ne]: null };
        where.actual_hours = { [Op.ne]: null };

        return WorkOrder.findAll({
            attributes: ['id', 'wo_number', 'title', 'estimated_hours', 'actual_hours', 'priority'],
            where,
            limit: 500,
            order: [['actual_end', 'DESC']],
            raw: true
        });
    }

    async getSiteComparison(orgId: string | null, dateFilter?: DateFilter): Promise<any[]> {
        const where = applyDateFilter(orgId ? { org_id: orgId } : {}, dateFilter);
        return WorkOrder.findAll({
            attributes: [
                'site_id',
                [fn('COUNT', col('WorkOrder.id')), 'total'],
                [fn('SUM', literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
                [fn('SUM', literal("CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END")), 'in_progress'],
                [fn('SUM', literal("CASE WHEN status IN ('new', 'open') THEN 1 ELSE 0 END")), 'pending'],
                [fn('SUM', literal("CASE WHEN status NOT IN ('completed', 'cancelled') AND scheduled_end IS NOT NULL AND scheduled_end < NOW() THEN 1 ELSE 0 END")), 'overdue']
            ],
            where,
            include: [{ model: Site, as: 'site', attributes: ['name'] }],
            group: ['site_id', 'site.id', 'site.name'],
            raw: true,
            nest: true
        });
    }

    async getAvgResolutionTime(orgId: string | null, siteId?: string): Promise<number> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;
        where.status = 'completed';
        where.actual_start = { [Op.ne]: null };
        where.actual_end = { [Op.ne]: null };

        const result = await WorkOrder.findOne({
            attributes: [[fn('AVG', literal('TIMESTAMPDIFF(HOUR, actual_start, actual_end)')), 'avg_hours']],
            where,
            raw: true
        }) as any;

        return result?.avg_hours ? Math.round(parseFloat(result.avg_hours) * 10) / 10 : 0;
    }

    // ─── TECHNICIAN PERFORMANCE ─────────────────────────────

    async getTechnicianPerformance(orgId: string | null, siteId?: string, dateFilter?: DateFilter): Promise<any[]> {
        const baseWhere: any = applyDateFilter(orgId ? { org_id: orgId } : {}, dateFilter);
        if (siteId) baseWhere.site_id = siteId;
        baseWhere.assignee_id = { [Op.ne]: null };

        return WorkOrder.findAll({
            attributes: [
                'assignee_id',
                [fn('COUNT', col('WorkOrder.id')), 'total_assigned'],
                [fn('SUM', literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
                [fn('SUM', literal("CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END")), 'in_progress'],
                [fn('SUM', literal("CASE WHEN status NOT IN ('completed', 'cancelled') AND scheduled_end IS NOT NULL AND scheduled_end < NOW() THEN 1 ELSE 0 END")), 'overdue']
            ],
            where: baseWhere,
            include: [{ model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'email'] }],
            group: ['assignee_id', 'assignee.id', 'assignee.first_name', 'assignee.last_name', 'assignee.email'],
            order: [[literal('completed'), 'DESC']],
            raw: true,
            nest: true
        });
    }

    // ─── PM ANALYTICS ───────────────────────────────────────

    async getPMCompliance(orgId: string | null, siteId?: string): Promise<{ total: number; completed: number; skipped: number; generated: number; rate: number }> {
        const where: any = {};
        if (orgId) {
            const pmIds = await PMSchedule.findAll({
                attributes: ['id'],
                where: { org_id: orgId, ...(siteId ? { site_id: siteId } : {}) },
                raw: true
            });
            const ids = pmIds.map((p: any) => p.id);
            if (ids.length === 0) return { total: 0, completed: 0, skipped: 0, generated: 0, rate: 0 };
            where.pm_schedule_id = { [Op.in]: ids };
        }

        const [total, completed, skipped, generated] = await Promise.all([
            PMExecution.count({ where }),
            PMExecution.count({ where: { ...where, status: 'completed' } }),
            PMExecution.count({ where: { ...where, status: 'skipped' } }),
            PMExecution.count({ where: { ...where, status: 'generated' } })
        ]);

        const rate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
        return { total, completed, skipped, generated, rate };
    }

    async getPMScheduleStatus(orgId: string | null, siteId?: string): Promise<{ active: number; paused: number; inactive: number }> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;

        const [active, paused, inactive] = await Promise.all([
            PMSchedule.count({ where: { ...where, is_active: true, is_paused: false, deleted_at: null } }),
            PMSchedule.count({ where: { ...where, is_paused: true, deleted_at: null } }),
            PMSchedule.count({ where: { ...where, is_active: false, deleted_at: null } })
        ]);
        return { active, paused, inactive };
    }

    // ─── INVENTORY ANALYTICS ────────────────────────────────

    async getInventoryStats(orgId: string | null, siteId?: string): Promise<{
        totalItems: number;
        totalQuantity: number;
        lowStockCount: number;
        totalValue: number;
    }> {
        const where: any = orgId ? { org_id: orgId, is_active: true } : { is_active: true };
        if (siteId) where.site_id = siteId;

        const items = await InventoryItem.findAll({ where, raw: true }) as any[];

        let totalQuantity = 0;
        let lowStockCount = 0;
        let totalValue = 0;

        items.forEach((item: any) => {
            totalQuantity += item.quantity || 0;
            if ((item.quantity || 0) <= (item.min_quantity || 0)) {
                lowStockCount++;
            }
            totalValue += (item.quantity || 0) * parseFloat(item.unit_cost || '0');
        });

        return {
            totalItems: items.length,
            totalQuantity,
            lowStockCount,
            totalValue: Math.round(totalValue * 100) / 100
        };
    }

    async getTopUsedParts(orgId: string | null, limit: number = 10, siteId?: string): Promise<any[]> {
        const woWhere: any = orgId ? { org_id: orgId } : {};
        if (siteId) woWhere.site_id = siteId;

        const woIds = await WorkOrder.findAll({
            attributes: ['id'],
            where: woWhere,
            raw: true
        });
        const ids = woIds.map((w: any) => w.id);
        if (ids.length === 0) return [];

        return WorkOrderInventoryItem.findAll({
            attributes: ['inventory_item_id', [fn('SUM', col('quantity_used')), 'total_used']],
            where: { work_order_id: { [Op.in]: ids } },
            include: [{ model: InventoryItem, as: 'item', attributes: ['name', 'sku', 'category', 'unit'] }],
            group: ['inventory_item_id', 'item.id', 'item.name', 'item.sku', 'item.category', 'item.unit'],
            order: [[literal('total_used'), 'DESC']],
            limit,
            raw: true,
            nest: true
        });
    }

    async getInventoryByCategory(orgId: string | null, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId, is_active: true } : { is_active: true };
        if (siteId) where.site_id = siteId;

        return InventoryItem.findAll({
            attributes: ['category', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('quantity')), 'total_quantity']],
            where,
            group: ['category'],
            raw: true
        });
    }

    async getInventoryCostTrend(orgId: string | null, months: number = 12): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT
                DATE_FORMAT(woi.created_at, '%Y-%m') AS month,
                ROUND(SUM(woi.quantity_used * CAST(ii.unit_cost AS DECIMAL(10,2))), 2) AS total_cost
            FROM work_order_inventory_items woi
            INNER JOIN inventory_items ii ON woi.inventory_item_id = ii.id
            INNER JOIN work_orders wo ON woi.work_order_id = wo.id
            WHERE woi.deleted_at IS NULL
              AND ii.deleted_at IS NULL
              ${orgId ? `AND wo.org_id = :orgId` : ''}
              AND woi.created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
            GROUP BY DATE_FORMAT(woi.created_at, '%Y-%m')
            ORDER BY month ASC
        `, {
            replacements: { orgId, months },
            type: QueryTypes.SELECT
        });
        return results;
    }

    // ─── ASSET ANALYTICS ────────────────────────────────────

    async getAssetsByType(orgId: string | null, siteId?: string): Promise<{ movable: number; immovable: number }> {
        const where: any = orgId ? { org_id: orgId, is_active: true } : { is_active: true };
        if (siteId) where.site_id = siteId;

        const [movable, immovable] = await Promise.all([
            Asset.count({ where: { ...where, asset_type: 'movable' } }),
            Asset.count({ where: { ...where, asset_type: 'immovable' } })
        ]);
        return { movable, immovable };
    }

    async getAssetsByStatus(orgId: string | null, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;

        return Asset.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            where,
            group: ['status'],
            raw: true
        });
    }

    // ─── USER ANALYTICS ─────────────────────────────────────

    async getUsersByRole(orgId: string | null): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT r.name AS role_name, COUNT(ur.user_id) AS count
            FROM user_roles ur
            INNER JOIN roles r ON ur.role_id = r.id
            INNER JOIN users u ON ur.user_id = u.id
            WHERE u.deleted_at IS NULL
              ${orgId ? `AND u.org_id = :orgId` : ''}
            GROUP BY r.name
            ORDER BY count DESC
        `, {
            replacements: { orgId },
            type: QueryTypes.SELECT
        });
        return results;
    }

    async getUserGrowth(orgId: string | null, months: number = 12): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM users
            WHERE deleted_at IS NULL
              ${orgId ? `AND org_id = :orgId` : ''}
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `, {
            replacements: { orgId, months },
            type: QueryTypes.SELECT
        });
        return results;
    }

    // ─── SITE ANALYTICS ─────────────────────────────────────

    async getSiteTechnicianCounts(orgId: string | null): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT s.id AS site_id, s.name AS site_name, COUNT(u.id) AS technician_count
            FROM sites s
            LEFT JOIN users u ON u.site_id = s.id AND u.deleted_at IS NULL
            WHERE s.deleted_at IS NULL
              ${orgId ? `AND s.org_id = :orgId` : ''}
            GROUP BY s.id, s.name
            ORDER BY technician_count DESC
        `, {
            replacements: { orgId },
            type: QueryTypes.SELECT
        });
        return results;
    }

    // ─── REQUESTOR ANALYTICS ────────────────────────────────

    async getMyRequestCounts(orgId: string | null, userId: string, dateFilter?: DateFilter): Promise<{
        total: number; completed: number; inProgress: number; pending: number;
    }> {
        const baseWhere = applyDateFilter({ org_id: orgId, requester_id: userId }, dateFilter);

        const [total, completed, inProgress, pending] = await Promise.all([
            WorkOrder.count({ where: baseWhere }),
            WorkOrder.count({ where: { ...baseWhere, status: 'completed' } }),
            WorkOrder.count({ where: { ...baseWhere, status: 'in_progress' } }),
            WorkOrder.count({ where: { ...baseWhere, status: { [Op.in]: ['new', 'open'] } } })
        ]);
        return { total, completed, inProgress, pending };
    }

    async getMyRequestTrend(orgId: string | null, userId: string, months: number = 12): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS count
            FROM work_orders
            WHERE deleted_at IS NULL
              AND org_id = :orgId
              AND requester_id = :userId
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL :months MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `, {
            replacements: { orgId, userId, months },
            type: QueryTypes.SELECT
        });
        return results;
    }

    async getMyRequestAvgResolution(orgId: string | null, userId: string): Promise<number> {
        const result = await WorkOrder.findOne({
            attributes: [[fn('AVG', literal('TIMESTAMPDIFF(HOUR, created_at, actual_end)')), 'avg_hours']],
            where: {
                org_id: orgId,
                requester_id: userId,
                status: 'completed',
                actual_end: { [Op.ne]: null }
            },
            raw: true
        }) as any;
        return result?.avg_hours ? Math.round(parseFloat(result.avg_hours) * 10) / 10 : 0;
    }

    // ─── AUDIT LOG ANALYTICS ────────────────────────────────

    async getAuditActivity(orgId: string | null, days: number = 30): Promise<any[]> {
        const results = await sequelize.query(`
            SELECT
                DATE(created_at) AS date,
                COUNT(*) AS count
            FROM audit_logs
            WHERE deleted_at IS NULL
              ${orgId ? `AND org_id = :orgId` : ''}
              AND created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, {
            replacements: { orgId, days },
            type: QueryTypes.SELECT
        });
        return results;
    }

    // ─── TOP REQUESTERS ─────────────────────────────────────

    async getTopRequesters(orgId: string | null, limit: number = 10, siteId?: string): Promise<any[]> {
        const where: any = orgId ? { org_id: orgId } : {};
        if (siteId) where.site_id = siteId;
        where.requester_id = { [Op.ne]: null };

        return WorkOrder.findAll({
            attributes: ['requester_id', [fn('COUNT', col('WorkOrder.id')), 'request_count']],
            where,
            include: [{ model: User, as: 'requester', attributes: ['id', 'first_name', 'last_name', 'email'] }],
            group: ['requester_id', 'requester.id', 'requester.first_name', 'requester.last_name', 'requester.email'],
            order: [[literal('request_count'), 'DESC']],
            limit,
            raw: true,
            nest: true
        });
    }
}

export const analyticsRepository = new AnalyticsRepository();
