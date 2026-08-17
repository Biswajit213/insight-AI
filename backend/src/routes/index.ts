import { Router } from 'express';
import authRoutes from './auth.routes';
import datasetRoutes from './dataset.routes';
import cleaningRoutes from './cleaning.routes';
import analysisRoutes from './analysis.routes';
import aiRoutes from './ai.routes';
import insightRoutes from './insight.routes';
import anomalyRoutes from './anomaly.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';
import uploadHistoryRoutes from './upload-history.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', cleaningRoutes);
router.use('/datasets', datasetRoutes);
router.use('/upload-history', uploadHistoryRoutes);
router.use('/analysis', analysisRoutes);
router.use('/ai', aiRoutes);
router.use('/insights', insightRoutes);
router.use('/anomalies', anomalyRoutes);
router.use('/reports', reportRoutes);
router.use('/user', userRoutes);

export default router;
