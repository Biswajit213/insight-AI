import { Router } from 'express';
import { AnomalyController } from '../controllers/anomaly.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', AnomalyController.listAnomalies);
router.post('/:id/resolve', AnomalyController.resolveAnomaly);

export default router;
