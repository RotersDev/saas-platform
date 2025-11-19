import { Router } from 'express';
import { AffiliateController } from '../controllers/affiliateController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const affiliateRoutes = Router();

affiliateRoutes.use(authenticate);
affiliateRoutes.use(resolveTenant);
affiliateRoutes.use(requireActiveStore);

affiliateRoutes.get('/', AffiliateController.list);
affiliateRoutes.post('/', requireStoreAdmin, AffiliateController.create);
affiliateRoutes.get('/:id', AffiliateController.getById);
affiliateRoutes.put('/:id', requireStoreAdmin, AffiliateController.update);
affiliateRoutes.get('/:id/dashboard', AffiliateController.getDashboard);
affiliateRoutes.post('/:id/pay', requireStoreAdmin, AffiliateController.payCommission);


