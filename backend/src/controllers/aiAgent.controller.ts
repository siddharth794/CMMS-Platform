import { Request, Response, NextFunction } from 'express';
import { aiAgentService } from '../services/aiAgent.service';

export class AIAgentController {
    smartCreateWorkOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user!;
            const auditContext = { 
                orgId: user.org_id, 
                userId: user.id, 
                userEmail: user.email,
                ipAddress: req.ip || req.socket.remoteAddress
            };
            
            const result = await aiAgentService.smartCreateWorkOrder(req.body, user, auditContext);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getLatestWorkOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { site_id, location } = req.query;
            const result = await aiAgentService.getLatestWorkOrders(site_id as string, location as string);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export const aiAgentController = new AIAgentController();
