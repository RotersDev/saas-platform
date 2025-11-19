import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

export const webhookRoutes = Router();

// Webhooks públicos (sem autenticação, vêm de serviços externos)
webhookRoutes.post('/pushin-pay', WebhookController.pushinPay);
webhookRoutes.post('/pushin-pay/check', WebhookController.checkPushinPayStatus);

