import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

// ─── EXISTING DASHBOARD ──────────────────────────────
router.get('/dashboard', analyticsController.getDashboard);
router.get('/technician-dashboard', analyticsController.getTechnicianDashboard);

// ─── WORK ORDER ANALYTICS ────────────────────────────
router.get('/work-orders-trend', requirePermission('analytics:view'), analyticsController.getWorkOrdersTrend);
router.get('/work-orders-by-site', requirePermission('analytics:view'), analyticsController.getWorkOrdersBySite);
router.get('/work-orders-by-category', requirePermission('analytics:view'), analyticsController.getWorkOrdersByCategory);
router.get('/top-assets', requirePermission('analytics:view'), analyticsController.getTopAssets);
router.get('/workload-by-day', requirePermission('analytics:view'), analyticsController.getWorkloadByDay);
router.get('/preventive-vs-reactive', requirePermission('analytics:view'), analyticsController.getPreventiveVsReactive);
router.get('/overdue-trend', requirePermission('analytics:view'), analyticsController.getOverdueTrend);
router.get('/estimated-vs-actual', requirePermission('analytics:view'), analyticsController.getEstimatedVsActual);
router.get('/site-comparison', requirePermission('analytics:view'), analyticsController.getSiteComparison);
router.get('/avg-resolution-time', requirePermission('analytics:view'), analyticsController.getAvgResolutionTime);

// ─── TECHNICIAN PERFORMANCE ──────────────────────────
router.get('/technician-performance', requirePermission('analytics:view'), analyticsController.getTechnicianPerformance);

// ─── PM ANALYTICS ────────────────────────────────────
router.get('/pm-compliance', requirePermission('analytics:view'), analyticsController.getPMCompliance);
router.get('/pm-status', requirePermission('analytics:view'), analyticsController.getPMScheduleStatus);

// ─── INVENTORY ANALYTICS ─────────────────────────────
router.get('/inventory-stats', requirePermission('analytics:view'), analyticsController.getInventoryStats);
router.get('/inventory-top-parts', requirePermission('analytics:view'), analyticsController.getTopUsedParts);
router.get('/inventory-by-category', requirePermission('analytics:view'), analyticsController.getInventoryByCategory);
router.get('/inventory-cost-trend', requirePermission('analytics:view'), analyticsController.getInventoryCostTrend);

// ─── ASSET ANALYTICS ─────────────────────────────────
router.get('/asset-stats', requirePermission('analytics:view'), analyticsController.getAssetStats);

// ─── USER ANALYTICS ──────────────────────────────────
router.get('/users-by-role', requirePermission('analytics:view'), analyticsController.getUsersByRole);
router.get('/user-growth', requirePermission('analytics:view'), analyticsController.getUserGrowth);

// ─── SITE ANALYTICS ──────────────────────────────────
router.get('/site-technician-counts', requirePermission('analytics:view'), analyticsController.getSiteTechnicianCounts);

// ─── TOP REQUESTERS ──────────────────────────────────
router.get('/top-requesters', requirePermission('analytics:view'), analyticsController.getTopRequesters);

// ─── AUDIT ANALYTICS ─────────────────────────────────
router.get('/audit-activity', requirePermission('analytics:view'), analyticsController.getAuditActivity);

// ─── REQUESTOR SPECIFIC ──────────────────────────────
router.get('/my-requests', analyticsController.getMyRequests);

// ─── COMPREHENSIVE DASHBOARD ─────────────────────────
router.get('/comprehensive', requirePermission('analytics:view'), analyticsController.getComprehensive);

export default router;
