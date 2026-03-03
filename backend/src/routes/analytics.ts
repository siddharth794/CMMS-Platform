import { Router } from 'express';
import { WorkOrder, Asset, PMSchedule, User, Role } from '../models';
import { authenticate } from '../middleware/auth';
import { Op, fn, col, literal } from 'sequelize';

const router = Router();
router.use(authenticate);

const WO_STATUSES = ['new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

router.get('/dashboard', async (req: any, res, next) => {
    try {
        const orgId = req.user.org_id;

        // --- Work Order counts ---
        const totalWorkOrders = await WorkOrder.count({ where: { org_id: orgId } });
        const completedWorkOrders = await WorkOrder.count({ where: { org_id: orgId, status: 'completed' } });
        const pendingWorkOrders = await WorkOrder.count({ where: { org_id: orgId, status: { [Op.in]: ['new', 'open'] } } });
        const inProgressWorkOrders = await WorkOrder.count({ where: { org_id: orgId, status: 'in_progress' } });

        const completionRate = totalWorkOrders > 0
            ? Math.round((completedWorkOrders / totalWorkOrders) * 1000) / 10
            : 0;

        // --- Asset count ---
        const totalAssets = await Asset.count({ where: { org_id: orgId, is_active: true } });

        // --- PM Schedule counts ---
        const activePmSchedules = await PMSchedule.count({ where: { org_id: orgId, is_active: true } });
        const overduePms = await PMSchedule.count({
            where: {
                org_id: orgId,
                is_active: true,
                next_due: { [Op.lt]: new Date() }
            }
        });

        // --- Work orders by status ---
        const woByStatus = [];
        for (const status of WO_STATUSES) {
            const count = await WorkOrder.count({ where: { org_id: orgId, status } });
            woByStatus.push({ status, count });
        }

        // --- Work orders by priority ---
        const woByPriority = [];
        for (const priority of PRIORITIES) {
            const count = await WorkOrder.count({ where: { org_id: orgId, priority } });
            woByPriority.push({ priority, count });
        }

        // --- Recent work orders ---
        const recentWorkOrders = await WorkOrder.findAll({
            where: { org_id: orgId },
            include: [
                { model: Asset },
                { model: User, as: 'assignee', include: [{ model: Role }] },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });

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

        // --- My Work Order counts ---
        const myAssigned = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId } });
        const myCompleted = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'completed' } });
        const myInProgress = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: 'in_progress' } });
        const myPending = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status: { [Op.in]: ['new', 'open'] } } });

        const myCompletionRate = myAssigned > 0
            ? Math.round((myCompleted / myAssigned) * 1000) / 10
            : 0;

        // --- My Overdue WOs (past scheduled_end but not completed/cancelled) ---
        const myOverdue = await WorkOrder.count({
            where: {
                org_id: orgId,
                assignee_id: userId,
                status: { [Op.notIn]: ['completed', 'cancelled'] },
                scheduled_end: { [Op.lt]: new Date(), [Op.ne]: null }
            }
        });

        // --- My WOs by status ---
        const myWoByStatus = [];
        for (const status of WO_STATUSES) {
            const count = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, status } });
            myWoByStatus.push({ status, count });
        }

        // --- My WOs by priority ---
        const myWoByPriority = [];
        for (const priority of PRIORITIES) {
            const count = await WorkOrder.count({ where: { org_id: orgId, assignee_id: userId, priority } });
            myWoByPriority.push({ priority, count });
        }

        // --- My recent work orders ---
        const myRecentWorkOrders = await WorkOrder.findAll({
            where: { org_id: orgId, assignee_id: userId },
            include: [
                { model: Asset },
                { model: User, as: 'requester', include: [{ model: Role }] }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });

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
