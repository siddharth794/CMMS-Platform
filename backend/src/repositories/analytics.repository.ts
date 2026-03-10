import { Op, fn, col } from 'sequelize';
import { WorkOrder, Asset, PMSchedule, User, Role } from '../models';

class AnalyticsRepository {
    async getDashboardCounts(orgId: string): Promise<{
        totalWorkOrders: number;
        completedWorkOrders: number;
        pendingWorkOrders: number;
        inProgressWorkOrders: number;
        totalAssets: number;
        activePmSchedules: number;
        overduePms: number;
    }> {
        const [
            totalWorkOrders, completedWorkOrders, pendingWorkOrders,
            inProgressWorkOrders, totalAssets, activePmSchedules, overduePms
        ] = await Promise.all([
            WorkOrder.count({ where: { org_id: orgId } }),
            WorkOrder.count({ where: { org_id: orgId, status: 'completed' } }),
            WorkOrder.count({ where: { org_id: orgId, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({ where: { org_id: orgId, status: 'in_progress' } }),
            Asset.count({ where: { org_id: orgId, is_active: true } }),
            PMSchedule.count({ where: { org_id: orgId, is_active: true } }),
            // next_due column was removed in PM Schema redesign.
            // Overdue PMs are now tracked via pm_executions or calculated differently. 
            // For now, returning 0 to prevent crashes.
            Promise.resolve(0)
        ]);
        return { totalWorkOrders, completedWorkOrders, pendingWorkOrders, inProgressWorkOrders, totalAssets, activePmSchedules, overduePms };
    }

    async getWoByStatusGrouped(orgId: string, assigneeId?: string): Promise<any[]> {
        const where: any = { org_id: orgId };
        if (assigneeId) where.assignee_id = assigneeId;
        return WorkOrder.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], where, group: ['status'], raw: true });
    }

    async getWoByPriorityGrouped(orgId: string, assigneeId?: string): Promise<any[]> {
        const where: any = { org_id: orgId };
        if (assigneeId) where.assignee_id = assigneeId;
        return WorkOrder.findAll({ attributes: ['priority', [fn('COUNT', col('id')), 'count']], where, group: ['priority'], raw: true });
    }

    async getRecentWorkOrders(orgId: string, assigneeId?: string): Promise<any[]> {
        const where: any = { org_id: orgId };
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

    async getTechnicianCounts(orgId: string, userId: string): Promise<{
        myAssigned: number; myCompleted: number; myInProgress: number; myPending: number; myOverdue: number;
    }> {
        const [myAssigned, myCompleted, myInProgress, myPending, myOverdue] = await Promise.all([
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'completed' } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'in_progress' } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: { [Op.notIn]: ['completed', 'cancelled'] }, scheduled_end: { [Op.lt]: new Date(), [Op.ne]: null as any } } })
        ]);
        return { myAssigned, myCompleted, myInProgress, myPending, myOverdue };
    }
}

export const analyticsRepository = new AnalyticsRepository();
