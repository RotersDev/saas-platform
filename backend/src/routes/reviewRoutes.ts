import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const reviewRoutes = Router();

reviewRoutes.use(authenticate);
reviewRoutes.use(resolveTenant);
reviewRoutes.use(requireActiveStore);

reviewRoutes.get('/', ReviewController.list);
reviewRoutes.post('/', ReviewController.create);
reviewRoutes.get('/:id', ReviewController.getById);
reviewRoutes.post('/:id/approve', requireStoreAdmin, ReviewController.approve);
reviewRoutes.post('/:id/reject', requireStoreAdmin, ReviewController.reject);


