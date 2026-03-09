import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import orgRoutes from './organizations';
import roleRoutes from './roles';
import accessRoutes from './accesses';
import groupRoutes from './groups';
import assetRoutes from './assets';
import woRoutes from './workOrders';
import pmRoutes from './pmSchedules';
import invRoutes from './inventory';
import analyticsRoutes from './analytics';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', orgRoutes);
router.use('/roles', roleRoutes);
router.use('/accesses', accessRoutes);
router.use('/groups', groupRoutes);
router.use('/assets', assetRoutes);
router.use('/work-orders', woRoutes);
router.use('/pm-schedules', pmRoutes);
router.use('/inventory', invRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
