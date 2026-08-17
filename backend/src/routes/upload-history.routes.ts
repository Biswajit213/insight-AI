import { Router } from 'express';
import { UploadHistoryController } from '../controllers/upload-history.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', UploadHistoryController.list);
router.post('/', UploadHistoryController.create);
router.delete('/', UploadHistoryController.clear);

export default router;
