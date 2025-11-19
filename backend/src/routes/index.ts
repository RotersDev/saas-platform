import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { storeRoutes } from './storeRoutes';
import { productRoutes } from './productRoutes';
import { orderRoutes } from './orderRoutes';
import { customerRoutes } from './customerRoutes';
import { couponRoutes } from './couponRoutes';
import { themeRoutes } from './themeRoutes';
import { categoryRoutes } from './categoryRoutes';
import { adminRoutes } from './adminRoutes';
import { apiRoutes } from './apiRoutes';
import { publicRoutes } from './publicRoutes';
import { customerPublicRoutes } from './customerPublicRoutes';
import { notificationRoutes } from './notificationRoutes';
import { domainRoutes } from './domainRoutes';
import { paymentMethodRoutes } from './paymentMethodRoutes';
import { webhookRoutes } from './webhookRoutes';

const router = Router();

// Rotas públicas primeiro (sem autenticação)
router.use('/public', publicRoutes);
router.use('/public/customer', customerPublicRoutes); // Rotas protegidas para clientes autenticados
router.use('/webhooks', webhookRoutes);

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/coupons', couponRoutes);
router.use('/themes', themeRoutes);
router.use('/categories', categoryRoutes);
router.use('/notifications', notificationRoutes);
router.use('/domains', domainRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/admin', adminRoutes);
router.use('/api', apiRoutes);

export default router;


