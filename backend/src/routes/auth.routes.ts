import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.post('/session', authenticateToken, AuthController.syncSession);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
