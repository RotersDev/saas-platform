import { Router } from 'express';
import { StoreController } from '../controllers/storeController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { upload } from '../middleware/upload';

export const storeRoutes = Router();

// Rota para criar loja (sem resolveTenant, pois ainda não tem loja)
storeRoutes.post('/create', authenticate, upload.single('logo'), StoreController.create);

// Rotas que precisam de tenant
storeRoutes.use(authenticate);
storeRoutes.use(resolveTenant);

storeRoutes.get('/', StoreController.getCurrent);
storeRoutes.put('/', requireStoreAdmin, StoreController.update);


