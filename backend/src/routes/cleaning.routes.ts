import { Router } from 'express';
import { CleaningController } from '../controllers/cleaning.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Dataset cleaning routes matching specification
router.get('/datasets/:id/profile', CleaningController.getProfile);
router.post('/datasets/:id/quality-scan', CleaningController.runQualityScan);
router.get('/datasets/:id/issues', CleaningController.getIssues);
router.get('/datasets/:id/issues/:issueId', CleaningController.getIssueById);
router.post('/datasets/:id/clean/preview', CleaningController.previewClean);
router.post('/datasets/:id/clean', CleaningController.cleanDataset);
router.post('/datasets/:id/validate', CleaningController.validateDataset);
router.get('/datasets/:id/cleaning-history', CleaningController.getCleaningHistory);
router.post('/datasets/:id/rollback', CleaningController.rollbackDataset);
router.get('/datasets/:id/versions', CleaningController.getVersions);
router.post('/datasets/:id/version', CleaningController.createVersion);
router.post('/datasets/:id/ai-cleaning-suggestions', CleaningController.getAICleaningSuggestions);
router.post('/datasets/:id/custom-rule', CleaningController.addCustomRule);
router.post('/datasets/:id/export', CleaningController.exportCleanedDataset);
router.get('/datasets/:id/report', CleaningController.getQualityReport);

export default router;
