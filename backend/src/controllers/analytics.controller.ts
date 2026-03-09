import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

class AnalyticsController {
    getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const roleName = (req.user?.Role?.name || '').toLowerCase();
        const isTechnician = roleName === 'technician';
        const data = await analyticsService.getDashboard(req.user!.org_id, isTechnician ? req.user!.id : undefined);
        res.json(data);
    }

    getTechnicianDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const data = await analyticsService.getTechnicianDashboard(req.user!.org_id, req.user!.id);
        res.json(data);
    }
}

export const analyticsController = new AnalyticsController();
