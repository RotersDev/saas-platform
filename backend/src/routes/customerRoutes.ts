import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const customerRoutes = Router();

customerRoutes.use(authenticate);
customerRoutes.use(resolveTenant);
customerRoutes.use(requireActiveStore);

customerRoutes.get('/', CustomerController.list);
customerRoutes.get('/:id', CustomerController.getById);
customerRoutes.put('/:id/block', requireStoreAdmin, CustomerController.block);
customerRoutes.put('/:id/unblock', requireStoreAdmin, CustomerController.unblock);
customerRoutes.post('/block', requireStoreAdmin, CustomerController.blockByEmailOrIp);


