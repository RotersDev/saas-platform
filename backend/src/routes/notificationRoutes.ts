import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.use(resolveTenant);
notificationRoutes.use(requireActiveStore);

notificationRoutes.get('/', NotificationController.list);
notificationRoutes.put('/', NotificationController.bulkUpdate);
notificationRoutes.put('/:type/:event', NotificationController.update);
notificationRoutes.post('/test', NotificationController.testWebhook);

