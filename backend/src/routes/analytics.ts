import { Router } from 'express';
import { WorkOrder, Asset, PMSchedule, User, Role } from '../models';
import { authenticate } from '../middleware/auth';
import { Op, fn, col } from 'sequelize';

const router = Router();
router.use(authenticate);

router.get('/dashboard', async (req: any, res, next) => {
    try {
        const orgId = req.user.org_id;

        // ─── Parallel execution of independent queries ───────────────
        const [
            totalWorkOrders,
            completedWorkOrders,
            pendingWorkOrders,
            inProgressWorkOrders,
            totalAssets,
            activePmSchedules,
            overduePms,
            woByStatusRaw,
            woByPriorityRaw,
            recentWorkOrders,
        ] = await Promise.all([
            WorkOrder.count({ where: { org_id: orgId } }),
            WorkOrder.count({ where: { org_id: orgId, status: 'completed' } }),
            WorkOrder.count({ where: { org_id: orgId, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({ where: { org_id: orgId, status: 'in_progress' } }),
            Asset.count({ where: { org_id: orgId, is_active: true } }),
            PMSchedule.count({ where: { org_id: orgId, is_active: true } }),
            PMSchedule.count({
                where: {
                    org_id: orgId,
                    is_active: true,
                    next_due: { [Op.lt]: new Date() }
                }
            }),
            // GROUP BY replaces N+1 loop (was 6 individual queries)
            WorkOrder.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                where: { org_id: orgId },
                group: ['status'],
                raw: true,
            }),
            // GROUP BY replaces N+1 loop (was 4 individual queries)
            WorkOrder.findAll({
                attributes: ['priority', [fn('COUNT', col('id')), 'count']],
                where: { org_id: orgId },
                group: ['priority'],
                raw: true,
            }),
            WorkOrder.findAll({
                where: { org_id: orgId },
                include: [
                    { model: Asset },
                    { model: User, as: 'assignee', include: [{ model: Role }] },
                    { model: User, as: 'requester', include: [{ model: Role }] }
                ],
                order: [['created_at', 'DESC']],
                limit: 10
            }),
        ]);

        const completionRate = totalWorkOrders > 0
            ? Math.round((completedWorkOrders / totalWorkOrders) * 1000) / 10
            : 0;

        // Normalize GROUP BY results to include all statuses/priorities (even with 0 count)
        const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
        const PRIORITIES = ['low', 'medium', 'high', 'critical'];

        const statusMap = new Map((woByStatusRaw as any[]).map(r => [r.status, parseInt(r.count)]));
        const woByStatus = WO_STATUSES.map(status => ({ status, count: statusMap.get(status) || 0 }));

        const priorityMap = new Map((woByPriorityRaw as any[]).map(r => [r.priority, parseInt(r.count)]));
        const woByPriority = PRIORITIES.map(priority => ({ priority, count: priorityMap.get(priority) || 0 }));

        res.json({
            stats: {
                total_work_orders: totalWorkOrders,
                completed_work_orders: completedWorkOrders,
                pending_work_orders: pendingWorkOrders,
                in_progress_work_orders: inProgressWorkOrders,
                completion_rate: completionRate,
                total_assets: totalAssets,
                active_pm_schedules: activePmSchedules,
                overdue_pms: overduePms
            },
            wo_by_status: woByStatus,
            wo_by_priority: woByPriority,
            recent_work_orders: recentWorkOrders
        });
    } catch (err) {
        next(err);
    }
});

// Technician-specific dashboard
router.get('/technician-dashboard', async (req: any, res, next) => {
    try {
        const orgId = req.user.org_id;
        const userId = req.user.id;

        const [
            myAssigned,
            myCompleted,
            myInProgress,
            myPending,
            myOverdue,
            myWoByStatusRaw,
            myWoByPriorityRaw,
            myRecentWorkOrders,
        ] = await Promise.all([
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'completed' } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'in_progress' } }),
            WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: { [Op.in]: ['new', 'open'] } } }),
            WorkOrder.count({
                where: {
                    org_id: orgId,
                    assignee_id: userId,
                    status: { [Op.notIn]: ['completed', 'cancelled'] },
                    scheduled_end: { [Op.lt]: new Date(), [Op.ne]: null as any }
                }
            }),
            // GROUP BY replaces N+1 loop
            WorkOrder.findAll({
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                where: { org_id: orgId, assignee_id: userId },
                group: ['status'],
                raw: true,
            }),
            WorkOrder.findAll({
                attributes: ['priority', [fn('COUNT', col('id')), 'count']],
                where: { org_id: orgId, assignee_id: userId },
                group: ['priority'],
                raw: true,
            }),
            WorkOrder.findAll({
                where: { org_id: orgId, assignee_id: userId },
                include: [
                    { model: Asset },
                    { model: User, as: 'requester', include: [{ model: Role }] }
                ],
                order: [['created_at', 'DESC']],
                limit: 10
            }),
        ]);

        const myCompletionRate = myAssigned > 0
            ? Math.round((myCompleted / myAssigned) * 1000) / 10
            : 0;

        const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
        const PRIORITIES = ['low', 'medium', 'high', 'critical'];

        const statusMap = new Map((myWoByStatusRaw as any[]).map(r => [r.status, parseInt(r.count)]));
        const myWoByStatus = WO_STATUSES.map(status => ({ status, count: statusMap.get(status) || 0 }));

        const priorityMap = new Map((myWoByPriorityRaw as any[]).map(r => [r.priority, parseInt(r.count)]));
        const myWoByPriority = PRIORITIES.map(priority => ({ priority, count: priorityMap.get(priority) || 0 }));

        res.json({
            stats: {
                my_assigned: myAssigned,
                my_completed: myCompleted,
                my_in_progress: myInProgress,
                my_pending: myPending,
                my_completion_rate: myCompletionRate,
                my_overdue: myOverdue
            },
            my_wo_by_status: myWoByStatus,
            my_wo_by_priority: myWoByPriority,
            my_recent_work_orders: myRecentWorkOrders
        });
    } catch (err) {
        next(err);
    }
});

export default router;
