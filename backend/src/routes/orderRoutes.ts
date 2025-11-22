import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const orderRoutes = Router();

// Webhook público do Mercado Pago
orderRoutes.post('/webhook', OrderController.webhook as any);

// Rotas protegidas
orderRoutes.use(authenticate);
orderRoutes.use(resolveTenant);
orderRoutes.use(requireActiveStore);

orderRoutes.get('/', OrderController.list);
orderRoutes.post('/', OrderController.create);
orderRoutes.get('/:orderNumber', OrderController.getById);
orderRoutes.post('/:orderNumber/deliver', requireStoreAdmin, OrderController.deliver);
orderRoutes.post('/:orderNumber/cancel', requireStoreAdmin, OrderController.cancel);
orderRoutes.post('/:orderNumber/check-payment', requireStoreAdmin, OrderController.checkPayment);
orderRoutes.post('/:orderNumber/refund', requireStoreAdmin, OrderController.refund);


