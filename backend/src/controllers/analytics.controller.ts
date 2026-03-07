import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

class AnalyticsController {
    async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await analyticsService.getDashboard(req.user!.org_id);
            res.json(data);
        } catch (err) { next(err); }
    }

    async getTechnicianDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await analyticsService.getTechnicianDashboard(req.user!.org_id, req.user!.id);
            res.json(data);
        } catch (err) { next(err); }
    }
}

export const analyticsController = new AnalyticsController();
