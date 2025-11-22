import { Router } from 'express';
import { ApiController } from '../controllers/apiController';
import { CustomerAuthController } from '../controllers/customerAuthController';
import { VisitController } from '../controllers/visitController';
import { CouponController } from '../controllers/couponController';
import { resolveTenantPublic } from '../middleware/tenant';
import { Theme, Category, Template } from '../models';

export const publicRoutes = Router();

// Middleware de log para debug
publicRoutes.use((req, _res, next) => {
  console.log('[PublicRoutes] 📥 Requisição recebida:', req.method, req.path, '| Host:', req.headers.host);
  next();
});

// Rotas públicas da loja (sem autenticação)
publicRoutes.use(resolveTenantPublic);

publicRoutes.get('/products', ApiController.listProducts);
publicRoutes.get('/products/:id', ApiController.getProduct);
publicRoutes.get('/products/slug/:slug', ApiController.getProductBySlug);
publicRoutes.post('/orders', ApiController.createOrder);
publicRoutes.get('/orders/:orderNumber', ApiController.getOrder);
publicRoutes.post('/orders/:orderNumber/check-payment', ApiController.checkPayment);

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
    const host = req.headers.host || '';
    const hostWithoutPort = host.split(':')[0];

    // Headers para evitar cache quando domínio é removido
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.store) {
      console.log('[PublicRoutes.getStore] ✅ Loja encontrada:', req.store.name, '| ID:', req.store.id, '| Host:', hostWithoutPort);
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
      console.log('[PublicRoutes.getStore] ❌ Loja NÃO encontrada para host:', hostWithoutPort);
      // Retornar 404 para que o frontend mostre "Loja não encontrada"
      // Isso acontece quando o domínio foi removido ou não existe
      res.status(404).json({ error: 'Loja não encontrada' });
    }
  } catch (error: any) {
    console.error('[PublicRoutes.getStore] ❌ Erro ao buscar loja:', error);
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

    // Buscar template ativo
    const activeTemplate = await Template.findOne({
      where: {
        store_id: req.store.id,
        is_active: true,
      },
    });

    // Se não há template ativo, buscar template padrão
    let template = activeTemplate;
    if (!template) {
      template = await Template.findOne({
        where: {
          store_id: req.store.id,
          is_default: true,
        },
      });
    }

    if (!theme) {
      // Retornar tema padrão com template
      res.json({
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#007bff',
        custom_css: template?.custom_css || '',
        custom_js: template?.custom_js || '',
      });
      return;
    }

    // Mesclar tema com template ativo (template tem prioridade)
    const response = {
      ...theme.toJSON(),
      custom_css: template?.custom_css || theme.custom_css || '',
      custom_js: template?.custom_js || theme.custom_js || '',
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tema' });
  }
});

// Validação pública de cupons
publicRoutes.post('/coupons/validate', CouponController.validate);

