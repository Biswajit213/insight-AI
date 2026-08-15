import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema } from '../validators/auth.validator';

const router = Router();

router.use(authenticateToken);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validateRequest(updateProfileSchema), UserController.updateProfile);

export default router;
