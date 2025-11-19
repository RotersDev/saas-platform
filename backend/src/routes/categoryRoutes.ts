import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.use(resolveTenant);
categoryRoutes.use(requireActiveStore);

categoryRoutes.get('/', CategoryController.list);
categoryRoutes.post('/', requireStoreAdmin, CategoryController.create);
categoryRoutes.put('/:id', requireStoreAdmin, CategoryController.update);
categoryRoutes.delete('/:id', requireStoreAdmin, CategoryController.delete);

