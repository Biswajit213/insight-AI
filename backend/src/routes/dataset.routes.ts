import { Router } from 'express';
import { DatasetController } from '../controllers/dataset.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', uploadRateLimiter, uploadMiddleware.single('file'), DatasetController.uploadDataset);
router.get('/', DatasetController.listDatasets);
router.get('/:id', DatasetController.getDataset);
router.get('/:id/preview', DatasetController.getDatasetPreview);
router.get('/:id/columns', DatasetController.getDatasetColumns);
router.get('/:id/statistics', DatasetController.getDatasetStatistics);
router.delete('/:id', DatasetController.deleteDataset);

export default router;
