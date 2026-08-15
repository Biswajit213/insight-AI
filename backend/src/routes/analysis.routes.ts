import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { runAnalysisSchema } from '../validators/analysis.validator';

const router = Router();

router.use(authenticateToken);

router.post('/', validateRequest(runAnalysisSchema), AnalysisController.runAnalysis);
router.get('/:id', AnalysisController.getAnalysisById);

export default router;
