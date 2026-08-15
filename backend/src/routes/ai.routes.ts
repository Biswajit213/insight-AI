import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { aiRateLimiter } from '../middleware/rate-limit.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  askAISchema,
  executiveSummarySchema,
  generateInsightsSchema,
  createConversationSchema,
  createMessageSchema,
} from '../validators/ai.validator';

const router = Router();

router.use(authenticateToken);

router.post('/ask', aiRateLimiter, validateRequest(askAISchema), AIController.askQuestion);
router.post('/executive-summary', aiRateLimiter, validateRequest(executiveSummarySchema), AIController.generateExecutiveSummary);
router.post('/insights', aiRateLimiter, validateRequest(generateInsightsSchema), AIController.generateInsights);

router.get('/conversations', AIController.listConversations);
router.post('/conversations', validateRequest(createConversationSchema), AIController.createConversation);
router.get('/conversations/:id', AIController.getConversationById);
router.post('/conversations/:id/messages', validateRequest(createMessageSchema), AIController.addMessageToConversation);
router.delete('/conversations/:id', AIController.deleteConversation);

export default router;
