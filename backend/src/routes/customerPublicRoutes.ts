import { Router } from 'express';
import { CustomerOrdersController } from '../controllers/customerOrdersController';
import { resolveTenantPublic } from '../middleware/tenant';
import { authenticateCustomer } from '../middleware/customerAuth';

export const customerPublicRoutes = Router();

// Resolver loja pelo subdomain
customerPublicRoutes.use(resolveTenantPublic);

// Autenticar cliente
customerPublicRoutes.use(authenticateCustomer);

// Rotas protegidas para clientes autenticados
customerPublicRoutes.get('/my-orders', CustomerOrdersController.listMyOrders);
customerPublicRoutes.get('/my-orders/:id', CustomerOrdersController.getMyOrder);

