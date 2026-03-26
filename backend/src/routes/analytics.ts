import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get main dashboard
 *     description: Get main dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/technician-dashboard:
 *   get:
 *     summary: Get technician dashboard
 *     description: Get technician-specific dashboard data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Technician dashboard data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/technician-dashboard', analyticsController.getTechnicianDashboard);

/**
 * @swagger
 * /analytics/work-orders-trend:
 *   get:
 *     summary: Get work orders trend
 *     description: Get work orders trend over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Work orders trend data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/work-orders-trend', requirePermission('analytics:view'), analyticsController.getWorkOrdersTrend);

/**
 * @swagger
 * /analytics/work-orders-by-site:
 *   get:
 *     summary: Get work orders by site
 *     description: Get work orders distribution by site
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Work orders by site
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/work-orders-by-site', requirePermission('analytics:view'), analyticsController.getWorkOrdersBySite);

/**
 * @swagger
 * /analytics/work-orders-by-category:
 *   get:
 *     summary: Get work orders by category
 *     description: Get work orders distribution by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Work orders by category
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/work-orders-by-category', requirePermission('analytics:view'), analyticsController.getWorkOrdersByCategory);

/**
 * @swagger
 * /analytics/top-assets:
 *   get:
 *     summary: Get top assets by issues
 *     description: Get assets with most work orders
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top assets data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/top-assets', requirePermission('analytics:view'), analyticsController.getTopAssets);

/**
 * @swagger
 * /analytics/workload-by-day:
 *   get:
 *     summary: Get workload by day
 *     description: Get work order workload distribution by day of week
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workload by day data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/workload-by-day', requirePermission('analytics:view'), analyticsController.getWorkloadByDay);

/**
 * @swagger
 * /analytics/preventive-vs-reactive:
 *   get:
 *     summary: Get preventive vs reactive ratio
 *     description: Get ratio of preventive to reactive work orders
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Preventive vs reactive data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/preventive-vs-reactive', requirePermission('analytics:view'), analyticsController.getPreventiveVsReactive);

/**
 * @swagger
 * /analytics/overdue-trend:
 *   get:
 *     summary: Get overdue trend
 *     description: Get trend of overdue work orders over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Overdue trend data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/overdue-trend', requirePermission('analytics:view'), analyticsController.getOverdueTrend);

/**
 * @swagger
 * /analytics/estimated-vs-actual:
 *   get:
 *     summary: Get estimated vs actual hours
 *     description: Compare estimated hours with actual hours spent
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estimated vs actual data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/estimated-vs-actual', requirePermission('analytics:view'), analyticsController.getEstimatedVsActual);

/**
 * @swagger
 * /analytics/site-comparison:
 *   get:
 *     summary: Get site comparison
 *     description: Compare metrics across different sites
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Site comparison data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/site-comparison', requirePermission('analytics:view'), analyticsController.getSiteComparison);

/**
 * @swagger
 * /analytics/avg-resolution-time:
 *   get:
 *     summary: Get average resolution time
 *     description: Get average time to resolve work orders
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Average resolution time data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/avg-resolution-time', requirePermission('analytics:view'), analyticsController.getAvgResolutionTime);

/**
 * @swagger
 * /analytics/technician-performance:
 *   get:
 *     summary: Get technician performance
 *     description: Get performance metrics for technicians
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Technician performance data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/technician-performance', requirePermission('analytics:view'), analyticsController.getTechnicianPerformance);

/**
 * @swagger
 * /analytics/pm-compliance:
 *   get:
 *     summary: Get PM compliance rate
 *     description: Get preventive maintenance compliance rate
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PM compliance data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/pm-compliance', requirePermission('analytics:view'), analyticsController.getPMCompliance);

/**
 * @swagger
 * /analytics/pm-status:
 *   get:
 *     summary: Get PM schedule status
 *     description: Get status overview of all PM schedules
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PM status data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/pm-status', requirePermission('analytics:view'), analyticsController.getPMScheduleStatus);

/**
 * @swagger
 * /analytics/inventory-stats:
 *   get:
 *     summary: Get inventory statistics
 *     description: Get overall inventory statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/inventory-stats', requirePermission('analytics:view'), analyticsController.getInventoryStats);

/**
 * @swagger
 * /analytics/inventory-top-parts:
 *   get:
 *     summary: Get top used parts
 *     description: Get most frequently used inventory parts
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top used parts data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/inventory-top-parts', requirePermission('analytics:view'), analyticsController.getTopUsedParts);

/**
 * @swagger
 * /analytics/inventory-by-category:
 *   get:
 *     summary: Get inventory by category
 *     description: Get inventory distribution by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory by category data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/inventory-by-category', requirePermission('analytics:view'), analyticsController.getInventoryByCategory);

/**
 * @swagger
 * /analytics/inventory-cost-trend:
 *   get:
 *     summary: Get inventory cost trend
 *     description: Get inventory cost trend over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Inventory cost trend data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/inventory-cost-trend', requirePermission('analytics:view'), analyticsController.getInventoryCostTrend);

/**
 * @swagger
 * /analytics/asset-stats:
 *   get:
 *     summary: Get asset statistics
 *     description: Get overall asset statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/asset-stats', requirePermission('analytics:view'), analyticsController.getAssetStats);

/**
 * @swagger
 * /analytics/users-by-role:
 *   get:
 *     summary: Get users by role
 *     description: Get user distribution by role
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Users by role data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users-by-role', requirePermission('analytics:view'), analyticsController.getUsersByRole);

/**
 * @swagger
 * /analytics/user-growth:
 *   get:
 *     summary: Get user growth trend
 *     description: Get user growth over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User growth data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/user-growth', requirePermission('analytics:view'), analyticsController.getUserGrowth);

/**
 * @swagger
 * /analytics/site-technician-counts:
 *   get:
 *     summary: Get site technician counts
 *     description: Get number of technicians per site
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Site technician counts data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/site-technician-counts', requirePermission('analytics:view'), analyticsController.getSiteTechnicianCounts);

/**
 * @swagger
 * /analytics/top-requesters:
 *   get:
 *     summary: Get top requesters
 *     description: Get users who created most work orders
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top requesters data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/top-requesters', requirePermission('analytics:view'), analyticsController.getTopRequesters);

/**
 * @swagger
 * /analytics/audit-activity:
 *   get:
 *     summary: Get audit activity
 *     description: Get recent audit/activity logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit activity data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/audit-activity', requirePermission('analytics:view'), analyticsController.getAuditActivity);

/**
 * @swagger
 * /analytics/my-requests:
 *   get:
 *     summary: Get my requests
 *     description: Get work orders created by the current user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My requests data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-requests', analyticsController.getMyRequests);

/**
 * @swagger
 * /analytics/comprehensive:
 *   get:
 *     summary: Get comprehensive analytics
 *     description: Get all analytics data in one request
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: org_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: site_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comprehensive analytics data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/comprehensive', requirePermission('analytics:view'), analyticsController.getComprehensive);

export default router;
