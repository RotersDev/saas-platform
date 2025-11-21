import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';
import { upload } from '../middleware/upload';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.use(resolveTenant);
categoryRoutes.use(requireActiveStore);

categoryRoutes.get('/', CategoryController.list);
categoryRoutes.post('/', requireStoreAdmin, upload.single('image'), CategoryController.create);
categoryRoutes.put('/:id', requireStoreAdmin, upload.single('image'), CategoryController.update);
categoryRoutes.delete('/:id', requireStoreAdmin, CategoryController.delete);
categoryRoutes.put('/order/update', requireStoreAdmin, CategoryController.updateOrder);

