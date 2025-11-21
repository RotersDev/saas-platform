import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';
import { uploadMultiple } from '../middleware/upload';

export const productRoutes = Router();

// Rotas protegidas (lojista)
productRoutes.use(authenticate);
productRoutes.use(resolveTenant);
productRoutes.use(requireActiveStore);

productRoutes.get('/', ProductController.list);
productRoutes.post('/', requireStoreAdmin, uploadMultiple.array('images', 10), ProductController.create);
productRoutes.get('/:id', ProductController.getById);
productRoutes.put('/:id', requireStoreAdmin, uploadMultiple.array('images', 10), ProductController.update);
productRoutes.delete('/:id', requireStoreAdmin, ProductController.delete);
productRoutes.get('/:id/keys', requireStoreAdmin, ProductController.getKeys);
productRoutes.post('/:id/keys', requireStoreAdmin, ProductController.uploadKeys);
productRoutes.delete('/:id/keys/:keyId', requireStoreAdmin, ProductController.deleteKey);
productRoutes.delete('/:id/keys', requireStoreAdmin, ProductController.deleteAllKeys);


