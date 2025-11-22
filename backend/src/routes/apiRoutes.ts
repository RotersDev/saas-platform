import { Router } from 'express';
import { ApiController } from '../controllers/apiController';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

export const apiRoutes = Router();

// API interna - requer autenticação
apiRoutes.use(authenticate);
apiRoutes.use(resolveTenant);

apiRoutes.get('/products', ApiController.listProducts);
apiRoutes.get('/products/:id', ApiController.getProduct);
apiRoutes.get('/orders', ApiController.listOrders);
apiRoutes.get('/orders/:orderNumber', ApiController.getOrder);
apiRoutes.get('/stock/:productId', ApiController.getStock);


