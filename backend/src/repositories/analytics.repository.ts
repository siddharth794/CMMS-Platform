import { Op, fn, col } from 'sequelize';
import { WorkOrder, Asset, PMSchedule, User, Role } from '../models';

interface DateFilter {
    startDate?: Date;
    endDate?: Date;
}

function applyDateFilter(where: any, filter?: DateFilter): any {
    if (filter?.startDate || filter?.endDate) {
        const dateCondition: any = {};
        if (filter.startDate) dateCondition[Op.gte] = filter.startDate;
        if (filter.endDate) dateCondition[Op.lte] = filter.endDate;
        where.created_at = dateCondition;
        console.log('[Analytics Repository] Applied date filter:', where);
    }
    return where;
}

class AnalyticsRepository {
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
}

export const analyticsRepository = new AnalyticsRepository();
