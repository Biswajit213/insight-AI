import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createReportSchema } from '../validators/report.validator';

const router = Router();

router.use(authenticateToken);

router.post('/', validateRequest(createReportSchema), ReportController.createReport);
router.get('/', ReportController.listReports);
router.get('/:id', ReportController.getReport);
router.post('/:id/generate', ReportController.generateReport);
router.delete('/:id', ReportController.deleteReport);

export default router;
