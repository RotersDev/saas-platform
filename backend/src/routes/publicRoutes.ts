import { Router } from 'express';
import { ApiController } from '../controllers/apiController';
import { CustomerAuthController } from '../controllers/customerAuthController';
import { VisitController } from '../controllers/visitController';
import { CouponController } from '../controllers/couponController';
import { resolveTenantPublic } from '../middleware/tenant';
import { Theme, Category } from '../models';

export const publicRoutes = Router();

// Rotas públicas da loja (sem autenticação)
publicRoutes.use(resolveTenantPublic);

publicRoutes.get('/products', ApiController.listProducts);
publicRoutes.get('/products/:id', ApiController.getProduct);
publicRoutes.get('/products/slug/:slug', ApiController.getProductBySlug);
publicRoutes.post('/orders', ApiController.createOrder);
publicRoutes.get('/orders/:id', ApiController.getOrder);
publicRoutes.post('/orders/:id/check-payment', ApiController.checkPayment);

// Tracking de visitas
publicRoutes.post('/visits/track', VisitController.trackVisit);

// Autenticação de clientes
publicRoutes.post('/customers/register', CustomerAuthController.register);
publicRoutes.post('/customers/login', CustomerAuthController.login);
// publicRoutes.post('/customers/login/google', CustomerAuthController.loginWithGoogle); // Removido - login com Google desabilitado
publicRoutes.post('/customers/create-password', CustomerAuthController.createPassword);
publicRoutes.post('/customers/forgot-password', CustomerAuthController.requestPasswordReset);
publicRoutes.post('/customers/reset-password', CustomerAuthController.resetPassword);

// Buscar categorias públicas
publicRoutes.get('/categories', async (req: any, res) => {
  try {
    if (!req.store) {
      res.json([]);
      return;
    }

    const categories = await Category.findAll({
      where: { store_id: req.store.id, is_active: true },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']],
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});
publicRoutes.get('/store', async (req: any, res) => {
  try {
    if (req.store) {
      res.json({
        id: req.store.id,
        name: req.store.name,
        subdomain: req.store.subdomain,
        logo_url: req.store.logo_url,
        status: req.store.status,
        domain: req.store.domain,
        require_login_to_purchase: req.store.require_login_to_purchase || false,
        settings: req.store.settings || {},
      });
    } else {
      res.json(null);
    }
  } catch (error: any) {
    console.error('Erro ao buscar loja:', error);
    res.status(500).json({ error: 'Erro ao buscar loja', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});
publicRoutes.get('/theme', async (req: any, res) => {
  try {
    if (!req.store) {
      res.json(null);
      return;
    }

    const theme = await Theme.findOne({
      where: { store_id: req.store.id },
    });

    if (!theme) {
      // Retornar tema padrão
      res.json({
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#007bff',
        custom_css: '',
      });
      return;
    }

    res.json(theme);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tema' });
  }
});

// Validação pública de cupons
publicRoutes.post('/coupons/validate', CouponController.validate);

