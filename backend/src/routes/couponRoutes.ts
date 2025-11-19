import { Router } from 'express';
import { CouponController } from '../controllers/couponController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const couponRoutes = Router();

couponRoutes.use(authenticate);
couponRoutes.use(resolveTenant);
couponRoutes.use(requireActiveStore);

couponRoutes.get('/', CouponController.list);
couponRoutes.post('/', requireStoreAdmin, CouponController.create);
couponRoutes.get('/:id', CouponController.getById);
couponRoutes.put('/:id', requireStoreAdmin, CouponController.update);
couponRoutes.delete('/:id', requireStoreAdmin, CouponController.delete);
couponRoutes.post('/validate', CouponController.validate);


