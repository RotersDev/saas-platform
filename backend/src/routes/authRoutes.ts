import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/refresh-token', authenticate, AuthController.refreshToken);
authRoutes.get('/me', authenticate, AuthController.me);
authRoutes.put('/profile', authenticate, upload.single('profile_picture'), AuthController.updateProfile);
authRoutes.post('/logout', authenticate, AuthController.logout);
authRoutes.get('/sessions', authenticate, AuthController.listSessions);
authRoutes.delete('/sessions/:sessionId', authenticate, AuthController.removeSession);
authRoutes.post('/forgot-password', AuthController.requestPasswordReset);
authRoutes.post('/reset-password', AuthController.resetPassword);


