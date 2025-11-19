import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const orderRoutes = Router();

// Webhook público do Mercado Pago
orderRoutes.post('/webhook', OrderController.webhook);

// Rotas protegidas
orderRoutes.use(authenticate);
orderRoutes.use(resolveTenant);
orderRoutes.use(requireActiveStore);

orderRoutes.get('/', OrderController.list);
orderRoutes.post('/', OrderController.create);
orderRoutes.get('/:id', OrderController.getById);
orderRoutes.post('/:id/deliver', requireStoreAdmin, OrderController.deliver);
orderRoutes.post('/:id/cancel', requireStoreAdmin, OrderController.cancel);
orderRoutes.post('/:id/check-payment', requireStoreAdmin, OrderController.checkPayment);
orderRoutes.post('/:id/refund', requireStoreAdmin, OrderController.refund);


