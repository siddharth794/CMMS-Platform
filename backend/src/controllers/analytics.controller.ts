import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

interface DateFilter {
    startDate?: Date;
    endDate?: Date;
}

function parseDateFilter(req: Request): DateFilter {
    const dateFilter: DateFilter = {};
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
    return dateFilter;
}

function parseOrgAndSite(req: Request): { orgId: string | null; siteId?: string } {
    const roleName = (req.user?.Role?.name || '').toLowerCase();
    let orgId: string | null | undefined = req.user!.org_id;

    if (roleName === 'super_admin' && !orgId) {
        orgId = req.query.org_id as string || undefined;
    }

    let siteId: string | undefined;
    if (roleName === 'facility_manager') {
        siteId = req.user?.site_id || req.user?.managed_site?.id || undefined;
    }
    if (req.query.site_id) {
        siteId = req.query.site_id as string;
    }

    return { orgId: orgId || null, siteId };
}

function parsePagination(req: Request): number {
    const limit = parseInt(req.query.limit as string) || 10;
    return Math.min(Math.max(limit, 1), 50);
}

class AnalyticsController {

    // ─── EXISTING ───────────────────────────────────────────

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

            const dateFilter = parseDateFilter(req);
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
            const dateFilter = parseDateFilter(req);
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

    // ─── WORK ORDER ANALYTICS ───────────────────────────────

    getWorkOrdersTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const months = parseInt(req.query.months as string) || 12;
            const data = await analyticsService.getWorkOrdersTrend(orgId, Math.min(months, 24), siteId);
            console.debug('[Analytics] WO Trend for org:', orgId, 'months:', months, 'results:', data?.length);
            res.json(data);
        } catch (error) { next(error); }
    }

    getWorkOrdersBySite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getWorkOrdersBySite(orgId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    getWorkOrdersByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getWorkOrdersByCategory(orgId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    getTopAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const limit = parsePagination(req);
            const data = await analyticsService.getTopAssets(orgId, limit, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getWorkloadByDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getWorkloadByDay(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getPreventiveVsReactive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getPreventiveVsReactive(orgId, siteId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    getOverdueTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const months = parseInt(req.query.months as string) || 6;
            const data = await analyticsService.getOverdueTrend(orgId, Math.min(months, 24), siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getEstimatedVsActual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getEstimatedVsActual(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getSiteComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getSiteComparison(orgId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    getAvgResolutionTime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getAvgResolutionTime(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── TECHNICIAN PERFORMANCE ─────────────────────────────

    getTechnicianPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getTechnicianPerformance(orgId, siteId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── PM ANALYTICS ───────────────────────────────────────

    getPMCompliance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getPMCompliance(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getPMScheduleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getPMScheduleStatus(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── INVENTORY ANALYTICS ────────────────────────────────

    getInventoryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getInventoryStats(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getTopUsedParts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const limit = parsePagination(req);
            const data = await analyticsService.getTopUsedParts(orgId, limit, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getInventoryByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getInventoryByCategory(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getInventoryCostTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const months = parseInt(req.query.months as string) || 12;
            const data = await analyticsService.getInventoryCostTrend(orgId, Math.min(months, 24));
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── ASSET ANALYTICS ────────────────────────────────────

    getAssetStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getAssetStats(orgId, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── USER ANALYTICS ─────────────────────────────────────

    getUsersByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getUsersByRole(orgId);
            res.json(data);
        } catch (error) { next(error); }
    }

    getUserGrowth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const months = parseInt(req.query.months as string) || 12;
            const data = await analyticsService.getUserGrowth(orgId, Math.min(months, 24));
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── SITE ANALYTICS ─────────────────────────────────────

    getSiteTechnicianCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const data = await analyticsService.getSiteTechnicianCounts(orgId);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── REQUESTOR ANALYTICS ────────────────────────────────

    getMyRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getMyRequests(orgId, req.user!.id, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── AUDIT ANALYTICS ────────────────────────────────────

    getAuditActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const days = parseInt(req.query.days as string) || 30;
            const data = await analyticsService.getAuditActivity(orgId, Math.min(days, 365));
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── TOP REQUESTERS ─────────────────────────────────────

    getTopRequesters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const limit = parsePagination(req);
            const data = await analyticsService.getTopRequesters(orgId, limit, siteId);
            res.json(data);
        } catch (error) { next(error); }
    }

    // ─── COMPREHENSIVE DASHBOARD ────────────────────────────

    getComprehensive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { orgId, siteId } = parseOrgAndSite(req);
            if (!orgId) { res.status(400).json({ detail: 'Organization ID required' }); return; }
            const dateFilter = parseDateFilter(req);
            const data = await analyticsService.getComprehensiveDashboard(orgId, siteId, dateFilter);
            res.json(data);
        } catch (error) { next(error); }
    }
}

export const analyticsController = new AnalyticsController();
