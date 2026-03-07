import { analyticsRepository } from '../repositories/analytics.repository';

const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function normalizeGrouped(raw: any[], key: string, allValues: string[]) {
    const map = new Map(raw.map((r: any) => [r[key], parseInt(r.count)]));
    return allValues.map(v => ({ [key]: v, count: map.get(v) || 0 }));
}

class AnalyticsService {
    async getDashboard(orgId: string): Promise<any> {
        const [counts, woByStatusRaw, woByPriorityRaw, recentWorkOrders] = await Promise.all([
            analyticsRepository.getDashboardCounts(orgId),
            analyticsRepository.getWoByStatusGrouped(orgId),
            analyticsRepository.getWoByPriorityGrouped(orgId),
            analyticsRepository.getRecentWorkOrders(orgId)
        ]);

        const completionRate = counts.totalWorkOrders > 0
            ? Math.round((counts.completedWorkOrders / counts.totalWorkOrders) * 1000) / 10
            : 0;

        return {
            stats: {
                total_work_orders: counts.totalWorkOrders,
                completed_work_orders: counts.completedWorkOrders,
                pending_work_orders: counts.pendingWorkOrders,
                in_progress_work_orders: counts.inProgressWorkOrders,
                completion_rate: completionRate,
                total_assets: counts.totalAssets,
                active_pm_schedules: counts.activePmSchedules,
                overdue_pms: counts.overduePms
            },
            wo_by_status: normalizeGrouped(woByStatusRaw, 'status', WO_STATUSES),
            wo_by_priority: normalizeGrouped(woByPriorityRaw, 'priority', PRIORITIES),
            recent_work_orders: recentWorkOrders
        };
    }

    async getTechnicianDashboard(orgId: string, userId: string): Promise<any> {
        const [counts, myWoByStatusRaw, myWoByPriorityRaw, myRecentWorkOrders] = await Promise.all([
            analyticsRepository.getTechnicianCounts(orgId, userId),
            analyticsRepository.getWoByStatusGrouped(orgId, userId),
            analyticsRepository.getWoByPriorityGrouped(orgId, userId),
            analyticsRepository.getRecentWorkOrders(orgId, userId)
        ]);

        const myCompletionRate = counts.myAssigned > 0
            ? Math.round((counts.myCompleted / counts.myAssigned) * 1000) / 10
            : 0;

        return {
            stats: {
                my_assigned: counts.myAssigned,
                my_completed: counts.myCompleted,
                my_in_progress: counts.myInProgress,
                my_pending: counts.myPending,
                my_completion_rate: myCompletionRate,
                my_overdue: counts.myOverdue
            },
            my_wo_by_status: normalizeGrouped(myWoByStatusRaw, 'status', WO_STATUSES),
            my_wo_by_priority: normalizeGrouped(myWoByPriorityRaw, 'priority', PRIORITIES),
            my_recent_work_orders: myRecentWorkOrders
        };
    }
}

export const analyticsService = new AnalyticsService();
