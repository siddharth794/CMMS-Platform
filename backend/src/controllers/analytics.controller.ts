import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

class AnalyticsController {
    getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const roleName = (req.user?.Role?.name || '').toLowerCase();
            const isTechnician = roleName === 'technician';

            let orgId: string | null | undefined = req.user!.org_id;
            
            if (roleName === 'super_admin' && !orgId) {
                orgId = req.query.org_id as string || undefined;
            }

            if (!orgId) {
                res.status(400).json({ detail: 'Organization ID required for analytics' });
                return;
            }

            const dateFilter: { startDate?: Date; endDate?: Date } = {};
            if (req.query.start_date) {
                const d = new Date(req.query.start_date as string);
                if (!isNaN(d.getTime())) {
                    d.setHours(0, 0, 0, 0);
                    dateFilter.startDate = d;
                }
            }
            if (req.query.end_date) {
                const d = new Date(req.query.end_date as string);
                if (!isNaN(d.getTime())) {
                    d.setHours(23, 59, 59, 999);
                    dateFilter.endDate = d;
                }
            }
            console.log('[Analytics Controller] Date filter:', dateFilter);

            const hasDateFilter = dateFilter.startDate || dateFilter.endDate;
            const data = await analyticsService.getDashboard(
                orgId,
                isTechnician ? req.user!.id : undefined,
                hasDateFilter ? dateFilter : undefined
            );
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    getTechnicianDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dateFilter: { startDate?: Date; endDate?: Date } = {};
            if (req.query.start_date) {
                const d = new Date(req.query.start_date as string);
                if (!isNaN(d.getTime())) dateFilter.startDate = d;
            }
            if (req.query.end_date) {
                const d = new Date(req.query.end_date as string);
                if (!isNaN(d.getTime())) dateFilter.endDate = d;
            }

            const hasDateFilter = dateFilter.startDate || dateFilter.endDate;
            const data = await analyticsService.getTechnicianDashboard(
                req.user!.org_id,
                req.user!.id,
                hasDateFilter ? dateFilter : undefined
            );
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();
