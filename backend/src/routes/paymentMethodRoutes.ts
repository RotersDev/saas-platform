import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethodController';
import { authenticate } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const paymentMethodRoutes = Router();

paymentMethodRoutes.use(authenticate);
paymentMethodRoutes.use(resolveTenant);
paymentMethodRoutes.use(requireActiveStore);

paymentMethodRoutes.get('/', PaymentMethodController.list);
paymentMethodRoutes.get('/:provider', PaymentMethodController.get);
paymentMethodRoutes.post('/', PaymentMethodController.upsert);
paymentMethodRoutes.put('/:provider', PaymentMethodController.upsert);
paymentMethodRoutes.delete('/:provider', PaymentMethodController.remove);

