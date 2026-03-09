import { analyticsRepository } from '../repositories/analytics.repository';

const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function normalizeGrouped(raw: any[], key: string, allValues: string[]) {
    const map = new Map(raw.map((r: any) => [r[key], parseInt(r.count)]));
    return allValues.map(v => ({ [key]: v, count: map.get(v) || 0 }));
}

class AnalyticsService {
    async getDashboard(orgId: string, userId?: string): Promise<any> {
        // If userId is provided, we fetch technician-specific stats but return them in the common dashboard format
        const [counts, woByStatusRaw, woByPriorityRaw, recentWorkOrders] = await Promise.all([
            userId ? analyticsRepository.getTechnicianCounts(orgId, userId) : analyticsRepository.getDashboardCounts(orgId),
            analyticsRepository.getWoByStatusGrouped(orgId, userId),
            analyticsRepository.getWoByPriorityGrouped(orgId, userId),
            analyticsRepository.getRecentWorkOrders(orgId, userId)
        ]);

        // Map technician count keys to dashboard keys if necessary
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

            // Also provide the specific my_* keys expected by TechnicianDashboardPage
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

    // Deprecated but keeping for backward compat if needed
    async getTechnicianDashboard(orgId: string, userId: string): Promise<any> {
        return this.getDashboard(orgId, userId);
    }
}

export const analyticsService = new AnalyticsService();
