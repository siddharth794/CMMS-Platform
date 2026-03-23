import { analyticsRepository } from '../repositories/analytics.repository';

const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const DAY_NAMES = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DateFilter {
    startDate?: Date;
    endDate?: Date;
}

function normalizeGrouped(raw: any[], key: string, allValues: string[]) {
    const map = new Map(raw.map((r: any) => [r[key], parseInt(r.count)]));
    return allValues.map(v => ({ [key]: v, count: map.get(v) || 0 }));
}

function fillMonthlyGaps(data: any[], months: number, valueKeys: string[]): any[] {
    const result: any[] = [];
    const map = new Map(data.map((d: any) => [d.month, d]));

    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = map.get(key);
        const entry: any = { month: key };
        valueKeys.forEach(k => {
            entry[k] = existing ? parseInt(existing[k]) || 0 : 0;
        });
        result.push(entry);
    }
    return result;
}

class AnalyticsService {

    // ─── EXISTING DASHBOARD ─────────────────────────────────

    async getDashboard(orgId: string | null, userId?: string, dateFilter?: DateFilter): Promise<any> {
        const [counts, woByStatusRaw, woByPriorityRaw, recentWorkOrders] = await Promise.all([
            userId
                ? analyticsRepository.getTechnicianCounts(orgId, userId, dateFilter)
                : analyticsRepository.getDashboardCounts(orgId, dateFilter),
            analyticsRepository.getWoByStatusGrouped(orgId, userId, dateFilter),
            analyticsRepository.getWoByPriorityGrouped(orgId, userId, dateFilter),
            analyticsRepository.getRecentWorkOrders(orgId, userId, dateFilter)
        ]);

        const stats: any = {};
        if (userId) {
            const techCounts = counts as any;
            stats.total_work_orders = techCounts.myAssigned;
            stats.completed_work_orders = techCounts.myCompleted;
            stats.in_progress_work_orders = techCounts.myInProgress;
            stats.pending_work_orders = techCounts.myPending;
            stats.total_assets = 0;
            stats.active_pm_schedules = 0;
            stats.overdue_pms = techCounts.myOverdue;
            stats.my_assigned = techCounts.myAssigned;
            stats.my_completed = techCounts.myCompleted;
            stats.my_in_progress = techCounts.myInProgress;
            stats.my_pending = techCounts.myPending;
            stats.my_overdue = techCounts.myOverdue;
            const completionRate = techCounts.myAssigned > 0
                ? Math.round((techCounts.myCompleted / techCounts.myAssigned) * 100)
                : 0;
            stats.my_completion_rate = completionRate;
        } else {
            const dashCounts = counts as any;
            stats.total_work_orders = dashCounts.totalWorkOrders;
            stats.completed_work_orders = dashCounts.completedWorkOrders;
            stats.pending_work_orders = dashCounts.pendingWorkOrders;
            stats.in_progress_work_orders = dashCounts.inProgressWorkOrders;
            stats.total_assets = dashCounts.totalAssets;
            stats.active_pm_schedules = dashCounts.activePmSchedules;
            stats.overdue_pms = dashCounts.overduePms;
        }

        const totalForRate = stats.total_work_orders;
        const completedForRate = stats.completed_work_orders;
        const completionRate = totalForRate > 0
            ? Math.round((completedForRate / totalForRate) * 1000) / 10
            : 0;
        stats.completion_rate = completionRate;

        return {
            stats,
            wo_by_status: normalizeGrouped(woByStatusRaw, 'status', WO_STATUSES),
            wo_by_priority: normalizeGrouped(woByPriorityRaw, 'priority', PRIORITIES),
            recent_work_orders: recentWorkOrders
        };
    }

    async getTechnicianDashboard(orgId: string | null, userId: string, dateFilter?: DateFilter): Promise<any> {
        return this.getDashboard(orgId, userId, dateFilter);
    }

    // ─── WORK ORDER ANALYTICS ───────────────────────────────

    async getWorkOrdersTrend(orgId: string | null, months: number = 12, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getWoTrend(orgId, months, siteId);
        return fillMonthlyGaps(raw as any[], months, ['created_count', 'completed_count']);
    }

    async getWorkOrdersBySite(orgId: string | null, dateFilter?: DateFilter): Promise<any> {
        const raw = await analyticsRepository.getWoBySite(orgId, dateFilter);
        return (raw as any[]).map((r: any) => ({
            site_name: r.site?.name || 'Unassigned',
            count: parseInt(r.count) || 0
        }));
    }

    async getWorkOrdersByCategory(orgId: string | null, dateFilter?: DateFilter): Promise<any> {
        const raw = await analyticsRepository.getWoByAssetCategory(orgId, dateFilter);
        return (raw as any[]).map((r: any) => ({
            category: r.category || 'Uncategorized',
            count: parseInt(r.count) || 0
        }));
    }

    async getTopAssets(orgId: string | null, limit: number = 10, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getTopAssetsByWOCount(orgId, limit, siteId);
        return (raw as any[]).map((r: any) => ({
            asset_id: r.asset_id,
            asset_name: r.asset?.name || 'Unknown',
            asset_tag: r.asset?.asset_tag || '',
            category: r.asset?.category || '',
            wo_count: parseInt(r.wo_count) || 0
        }));
    }

    async getWorkloadByDay(orgId: string | null, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getWoByDayOfWeek(orgId, siteId) as any[];
        const dayMap = new Map(raw.map((r: any) => [parseInt(r.day_of_week), parseInt(r.count)]));
        return DAY_NAMES.slice(1).map((name, idx) => ({
            day: name,
            day_number: idx + 1,
            count: dayMap.get(idx + 1) || 0
        }));
    }

    async getPreventiveVsReactive(orgId: string | null, siteId?: string, dateFilter?: DateFilter): Promise<any> {
        return analyticsRepository.getPreventiveVsReactive(orgId, siteId, dateFilter);
    }

    async getOverdueTrend(orgId: string | null, months: number = 6, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getOverdueTrend(orgId, months, siteId);
        return fillMonthlyGaps(raw as any[], months, ['count']);
    }

    async getEstimatedVsActual(orgId: string | null, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getEstimatedVsActual(orgId, siteId);
        return (raw as any[]).map((r: any) => ({
            id: r.id,
            wo_number: r.wo_number,
            title: r.title,
            estimated_hours: r.estimated_hours,
            actual_hours: r.actual_hours,
            priority: r.priority,
            variance: r.actual_hours - r.estimated_hours
        }));
    }

    async getSiteComparison(orgId: string | null, dateFilter?: DateFilter): Promise<any> {
        const raw = await analyticsRepository.getSiteComparison(orgId, dateFilter);
        return (raw as any[]).map((r: any) => ({
            site_id: r.site_id,
            site_name: r.site?.name || 'Unknown',
            total: parseInt(r.total) || 0,
            completed: parseInt(r.completed) || 0,
            in_progress: parseInt(r.in_progress) || 0,
            pending: parseInt(r.pending) || 0,
            overdue: parseInt(r.overdue) || 0
        }));
    }

    async getAvgResolutionTime(orgId: string | null, siteId?: string): Promise<{ avg_hours: number }> {
        const avg = await analyticsRepository.getAvgResolutionTime(orgId, siteId);
        return { avg_hours: avg };
    }

    // ─── TECHNICIAN PERFORMANCE ─────────────────────────────

    async getTechnicianPerformance(orgId: string | null, siteId?: string, dateFilter?: DateFilter): Promise<any> {
        const raw = await analyticsRepository.getTechnicianPerformance(orgId, siteId, dateFilter);
        return (raw as any[]).map((r: any) => ({
            technician_id: r.assignee_id,
            first_name: r.assignee?.first_name || '',
            last_name: r.assignee?.last_name || '',
            email: r.assignee?.email || '',
            total_assigned: parseInt(r.total_assigned) || 0,
            completed: parseInt(r.completed) || 0,
            in_progress: parseInt(r.in_progress) || 0,
            overdue: parseInt(r.overdue) || 0,
            completion_rate: parseInt(r.total_assigned) > 0
                ? Math.round((parseInt(r.completed) / parseInt(r.total_assigned)) * 1000) / 10
                : 0
        }));
    }

    // ─── PM ANALYTICS ───────────────────────────────────────

    async getPMCompliance(orgId: string | null, siteId?: string): Promise<any> {
        return analyticsRepository.getPMCompliance(orgId, siteId);
    }

    async getPMScheduleStatus(orgId: string | null, siteId?: string): Promise<any> {
        return analyticsRepository.getPMScheduleStatus(orgId, siteId);
    }

    // ─── INVENTORY ANALYTICS ────────────────────────────────

    async getInventoryStats(orgId: string | null, siteId?: string): Promise<any> {
        return analyticsRepository.getInventoryStats(orgId, siteId);
    }

    async getTopUsedParts(orgId: string | null, limit: number = 10, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getTopUsedParts(orgId, limit, siteId);
        return (raw as any[]).map((r: any) => ({
            inventory_item_id: r.inventory_item_id,
            name: r.item?.name || 'Unknown',
            sku: r.item?.sku || '',
            category: r.item?.category || '',
            unit: r.item?.unit || 'pcs',
            total_used: parseInt(r.total_used) || 0
        }));
    }

    async getInventoryByCategory(orgId: string | null, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getInventoryByCategory(orgId, siteId);
        return (raw as any[]).map((r: any) => ({
            category: r.category,
            item_count: parseInt(r.count) || 0,
            total_quantity: parseInt(r.total_quantity) || 0
        }));
    }

    async getInventoryCostTrend(orgId: string | null, months: number = 12): Promise<any> {
        const raw = await analyticsRepository.getInventoryCostTrend(orgId, months);
        return fillMonthlyGaps(raw as any[], months, ['total_cost']);
    }

    // ─── ASSET ANALYTICS ────────────────────────────────────

    async getAssetStats(orgId: string | null, siteId?: string): Promise<any> {
        const [byType, byStatus] = await Promise.all([
            analyticsRepository.getAssetsByType(orgId, siteId),
            analyticsRepository.getAssetsByStatus(orgId, siteId)
        ]);
        return { by_type: byType, by_status: byStatus };
    }

    // ─── USER ANALYTICS ─────────────────────────────────────

    async getUsersByRole(orgId: string | null): Promise<any> {
        return analyticsRepository.getUsersByRole(orgId);
    }

    async getUserGrowth(orgId: string | null, months: number = 12): Promise<any> {
        const raw = await analyticsRepository.getUserGrowth(orgId, months);
        return fillMonthlyGaps(raw as any[], months, ['count']);
    }

    // ─── SITE ANALYTICS ─────────────────────────────────────

    async getSiteTechnicianCounts(orgId: string | null): Promise<any> {
        return analyticsRepository.getSiteTechnicianCounts(orgId);
    }

    // ─── REQUESTOR ANALYTICS ────────────────────────────────

    async getMyRequests(orgId: string | null, userId: string, dateFilter?: DateFilter): Promise<any> {
        const [counts, trend, avgResolution, myStatusRaw, myPriorityRaw] = await Promise.all([
            analyticsRepository.getMyRequestCounts(orgId, userId, dateFilter),
            analyticsRepository.getMyRequestTrend(orgId, userId),
            analyticsRepository.getMyRequestAvgResolution(orgId, userId),
            analyticsRepository.getWoByStatusGrouped(orgId, undefined, undefined),
            analyticsRepository.getWoByPriorityGrouped(orgId, undefined, undefined)
        ]);

        return {
            stats: {
                total_requests: counts.total,
                completed: counts.completed,
                in_progress: counts.inProgress,
                pending: counts.pending,
                completion_rate: counts.total > 0
                    ? Math.round((counts.completed / counts.total) * 1000) / 10
                    : 0,
                avg_resolution_hours: avgResolution
            },
            trend: fillMonthlyGaps(trend as any[], 12, ['count']),
            wo_by_status: normalizeGrouped(myStatusRaw, 'status', WO_STATUSES),
            wo_by_priority: normalizeGrouped(myPriorityRaw, 'priority', PRIORITIES)
        };
    }

    // ─── AUDIT ANALYTICS ────────────────────────────────────

    async getAuditActivity(orgId: string | null, days: number = 30): Promise<any> {
        return analyticsRepository.getAuditActivity(orgId, days);
    }

    // ─── TOP REQUESTERS ─────────────────────────────────────

    async getTopRequesters(orgId: string | null, limit: number = 10, siteId?: string): Promise<any> {
        const raw = await analyticsRepository.getTopRequesters(orgId, limit, siteId);
        return (raw as any[]).map((r: any) => ({
            requester_id: r.requester_id,
            first_name: r.requester?.first_name || '',
            last_name: r.requester?.last_name || '',
            email: r.requester?.email || '',
            request_count: parseInt(r.request_count) || 0
        }));
    }

    // ─── COMPREHENSIVE DASHBOARD ────────────────────────────

    async getComprehensiveDashboard(orgId: string | null, siteId?: string, dateFilter?: DateFilter): Promise<any> {
        const [
            avgResolution,
            pmCompliance,
            pmStatus,
            preventiveVsReactive,
            inventoryStats,
            assetsByType
        ] = await Promise.all([
            analyticsRepository.getAvgResolutionTime(orgId, siteId),
            analyticsRepository.getPMCompliance(orgId, siteId),
            analyticsRepository.getPMScheduleStatus(orgId, siteId),
            analyticsRepository.getPreventiveVsReactive(orgId, siteId, dateFilter),
            analyticsRepository.getInventoryStats(orgId, siteId),
            analyticsRepository.getAssetsByType(orgId, siteId)
        ]);

        return {
            avg_resolution_hours: avgResolution,
            pm_compliance: pmCompliance,
            pm_status: pmStatus,
            preventive_vs_reactive: preventiveVsReactive,
            inventory_stats: inventoryStats,
            assets_by_type: assetsByType
        };
    }
}

export const analyticsService = new AnalyticsService();
