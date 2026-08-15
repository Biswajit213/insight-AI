import { Router } from 'express';
import { InsightController } from '../controllers/insight.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', InsightController.listInsights);
router.post('/analyze', InsightController.analyzeDataset);
router.get('/:id/investigate', InsightController.investigateInsight);
router.post('/:id/what-if', InsightController.simulateWhatIf);
router.post('/:id/feedback', InsightController.submitFeedback);
router.post('/:id/ask', InsightController.askAIAboutInsight);

export default router;
