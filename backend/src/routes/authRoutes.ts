import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/refresh-token', authenticate, AuthController.refreshToken);
authRoutes.get('/me', authenticate, AuthController.me);
authRoutes.post('/forgot-password', AuthController.requestPasswordReset);
authRoutes.post('/reset-password', AuthController.resetPassword);


