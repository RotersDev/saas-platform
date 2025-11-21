import { Response } from 'express';
import { Product, Order, ProductKey } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { OrderService } from '../services/orderService';

export class ApiController {
  static async listProducts(req: any, res: Response): Promise<void> {
    try {
      // Log para debug - SEMPRE logar
      console.log('[ApiController.listProducts] 🚀 REQUISIÇÃO RECEBIDA');
      console.log('[ApiController.listProducts] 📍 URL:', req.originalUrl || req.url);
      console.log('[ApiController.listProducts] 🌐 Host:', req.headers.host);
      console.log('[ApiController.listProducts] 📨 Headers:', {
        'x-store-subdomain': req.headers['x-store-subdomain'],
        'user-agent': req.headers['user-agent']?.substring(0, 50),
      });
      console.log('[ApiController.listProducts] 🏪 Store encontrada:', req.store ? `✅ Sim - ${req.store.name} (ID: ${req.store.id}, Subdomain: ${req.store.subdomain})` : '❌ Não');

      if (!req.store) {
        console.warn('[ApiController.listProducts] Loja não encontrada - retornando array vazio');
        res.json([]);
        return;
      }

      // Verificar se a loja está bloqueada ou suspensa
      if (req.store.status === 'blocked' || req.store.status === 'suspended') {
        res.status(403).json({
          error: 'Loja bloqueada ou suspensa',
          status: req.store.status
        });
        return;
      }

      const { category_id, category_slug } = req.query;
      const where: any = { store_id: req.store.id, is_active: true };

      // Log para debug - SEMPRE logar
      console.log('[ApiController.listProducts] 🔍 Buscando produtos para store_id:', req.store.id);
      console.log('[ApiController.listProducts] 📋 Query params:', { category_id, category_slug });
      console.log('[ApiController.listProducts] 🔎 Where clause:', JSON.stringify(where));

      if (category_slug) {
        // Buscar categoria por slug
        const { Category } = await import('../models');
        const category = await Category.findOne({
          where: { slug: category_slug, store_id: req.store.id, is_active: true },
        });
        if (category) {
          where.category_id = category.id;
        } else {
          // Se categoria não existe, retornar vazio
          res.json([]);
          return;
        }
      } else if (category_id) {
        where.category_id = category_id;
      }

      const products = await Product.findAll({
        where,
        attributes: ['id', 'name', 'slug', 'price', 'promotional_price', 'images', 'category_id', 'sales_count', 'featured', 'stock_limit'],
        include: [{ association: 'categoryData', required: false }],
        order: [['created_at', 'DESC']],
      });

      // Log para debug
      console.log('[ApiController.listProducts] ✅ Produtos encontrados:', products.length, '| Store ID:', req.store.id, '| Store Name:', req.store.name);

      if (products.length === 0) {
        console.warn('[ApiController.listProducts] ⚠️ Nenhum produto encontrado para a loja. Verificando produtos no banco...');
        // Verificar se há produtos no banco (mesmo inativos) para debug
        try {
          const allProducts = await Product.count({ where: { store_id: req.store.id } });
          const activeProducts = await Product.count({ where: { store_id: req.store.id, is_active: true } });
          const inactiveProducts = await Product.count({ where: { store_id: req.store.id, is_active: false } });
          console.log('[ApiController.listProducts] 📊 Estatísticas de produtos:');
          console.log('  - Total de produtos:', allProducts);
          console.log('  - Produtos ativos:', activeProducts);
          console.log('  - Produtos inativos:', inactiveProducts);
          console.log('  - Store ID:', req.store.id);
          console.log('  - Store Subdomain:', req.store.subdomain);

          // Se há produtos mas nenhum ativo, listar os inativos
          if (allProducts > 0 && activeProducts === 0) {
            const inactiveList = await Product.findAll({
              where: { store_id: req.store.id, is_active: false },
              attributes: ['id', 'name', 'is_active'],
              limit: 5,
            });
            console.log('[ApiController.listProducts] 📋 Produtos inativos encontrados:', inactiveList.map(p => ({ id: p.id, name: p.name, is_active: p.is_active })));
          }
        } catch (countError: any) {
          console.error('[ApiController.listProducts] Erro ao contar produtos:', countError);
        }
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  }

  static async getProduct(req: any, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      // Verificar se a loja está bloqueada ou suspensa
      if (req.store.status === 'blocked' || req.store.status === 'suspended') {
        res.status(403).json({
          error: 'Loja bloqueada ou suspensa',
          status: req.store.status
        });
        return;
      }

      const product = await Product.findOne({
        where: { id: req.params.id, store_id: req.store.id, is_active: true },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }

  static async getProductBySlug(req: any, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      // Verificar se a loja está bloqueada ou suspensa
      if (req.store.status === 'blocked' || req.store.status === 'suspended') {
        res.status(403).json({
          error: 'Loja bloqueada ou suspensa',
          status: req.store.status
        });
        return;
      }

      const product = await Product.findOne({
        where: { slug: req.params.slug, store_id: req.store.id, is_active: true },
        include: [{ association: 'categoryData' }],
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      // Buscar estoque disponível (chaves não usadas)
      const availableStock = await ProductKey.count({
        where: { product_id: product.id, is_used: false },
      });

      // Adicionar estoque disponível ao produto
      const productData = product.toJSON() as any;
      productData.available_stock = availableStock;

      res.json(productData);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }

  static async listOrders(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const orders = await Order.findAll({
        where: { store_id: req.store.id },
        include: [{ association: 'items' }],
        order: [['created_at', 'DESC']],
        limit: 100,
      });

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  }

  static async getOrder(req: any, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { Op } = require('sequelize');
      const orderIdentifier = decodeURIComponent(req.params.id);

      // Tentar buscar por order_number primeiro, depois por ID numérico
      const order = await Order.findOne({
        where: {
          store_id: req.store.id,
          [Op.or]: [
            { order_number: orderIdentifier },
            { id: isNaN(Number(orderIdentifier)) ? -1 : Number(orderIdentifier) },
          ],
        },
        include: [
          { association: 'items' },
          {
            association: 'payment',
            required: false,
          },
        ],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      // Formatar resposta para incluir dados do pagamento
      const orderData = order.toJSON() as any;
      if (orderData.payment) {
        // Manter todos os campos do pagamento para compatibilidade
        orderData.payment = {
          ...orderData.payment,
          qr_code: orderData.payment.pix_qr_code || orderData.payment.qr_code,
          qr_code_base64: orderData.payment.pix_qr_code_base64 || orderData.payment.qr_code_base64,
          pix_qr_code: orderData.payment.pix_qr_code,
          pix_qr_code_base64: orderData.payment.pix_qr_code_base64,
          status: orderData.payment.status,
        };
      }

      res.json(orderData);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  }

  static async checkPayment(req: any, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { Op } = require('sequelize');
      const orderIdentifier = decodeURIComponent(req.params.id);

      // Tentar buscar por order_number primeiro, depois por ID numérico
      const order = await Order.findOne({
        where: {
          store_id: req.store.id,
          [Op.or]: [
            { order_number: orderIdentifier },
            { id: isNaN(Number(orderIdentifier)) ? -1 : Number(orderIdentifier) },
          ],
        },
        include: [{ association: 'payment' }],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      const payment = (order as any).payment;
      if (!payment) {
        res.json({ paid: false, message: 'Pagamento não encontrado' });
        return;
      }

      // Se já está aprovado, retornar direto
      if (payment.status === 'approved') {
        res.json({
          paid: true,
          status: payment.status,
        });
        return;
      }

      // Verificar se é pagamento via Pushin Pay
      if (payment.pushin_pay_id && payment.metadata?.provider === 'pushin_pay') {
        // Usar token da plataforma para consultar status
        const platformToken = process.env.PUSHIN_PAY_TOKEN;
        const sandbox = process.env.PUSHIN_PAY_SANDBOX === 'true';

        if (!platformToken) {
          res.json({
            paid: payment.status === 'approved',
            status: payment.status,
            message: 'Token da plataforma não configurado'
          });
          return;
        }

        try {
          const { PushinPayService } = require('../services/pushinPayService');
          const transaction = await PushinPayService.getTransaction(
            {
              token: platformToken,
              sandbox: sandbox,
            },
            payment.pushin_pay_id
          );

          if (transaction && transaction.status === 'paid' && payment.status !== 'approved') {
            // Atualizar pagamento e pedido
            await payment.update({ status: 'approved' });
            await order.update({
              payment_status: 'paid',
              status: 'paid',
            });

            // Creditar na carteira
            try {
              const { OrderService } = require('../services/orderService');
              await OrderService.creditWalletAfterPayment(order.id);
            } catch (walletError) {
              console.error('Erro ao creditar carteira:', walletError);
            }

            // Entregar pedido automaticamente
            try {
              const { OrderService } = require('../services/orderService');
              await OrderService.deliverOrder(order.id);
            } catch (deliveryError) {
              console.error('Erro ao entregar pedido:', deliveryError);
            }

            res.json({ paid: true, status: 'approved', message: 'Pagamento confirmado!' });
            return;
          }

          res.json({
            paid: transaction?.status === 'paid' || payment.status === 'approved',
            status: transaction?.status || payment.status
          });
        } catch (error: any) {
          console.error('Erro ao consultar Pushin Pay:', error);
          // Em caso de erro, retornar status atual
          res.json({
            paid: payment.status === 'approved',
            status: payment.status
          });
        }
      } else {
        // Para outros métodos ou sem pushin_pay_id, retornar status atual
        res.json({
          paid: payment.status === 'approved',
          status: payment.status,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao verificar pagamento' });
    }
  }

  static async getStock(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const available = await ProductKey.count({
        where: {
          product_id: req.params.productId,
          is_used: false,
        },
        include: [
          {
            association: 'product',
            where: { store_id: req.store.id },
            required: true,
          },
        ],
      });

      res.json({ product_id: req.params.productId, available });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
  }

  static async createOrder(req: any, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      // Verificar se a loja está bloqueada ou suspensa
      if (req.store.status === 'blocked' || req.store.status === 'suspended') {
        res.status(403).json({
          error: 'Loja bloqueada ou suspensa',
          status: req.store.status
        });
        return;
      }

      const { items, customer, coupon_code, affiliate_code } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Itens do pedido são obrigatórios' });
        return;
      }

      if (!customer || !customer.email || !customer.email.trim()) {
        res.status(400).json({ error: 'E-mail do cliente é obrigatório' });
        return;
      }

      // Capturar IP e User Agent
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Extrair informações do User Agent
      const parseUserAgent = (ua: string) => {
        const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);
        const osMatch = ua.match(/(Windows|Mac|Linux|Android|iOS)/);
        return {
          browser: browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : 'Unknown',
          os: osMatch ? osMatch[1] : 'Unknown',
          full: ua,
        };
      };

      const deviceInfo = parseUserAgent(userAgent);

      // Verificar se login é obrigatório
      if (req.store.require_login_to_purchase && !req.body.customer_id) {
        res.status(403).json({
          error: 'Login obrigatório para realizar compras nesta loja',
          requires_login: true
        });
        return;
      }

      const order = await OrderService.createOrder({
        store_id: req.store.id,
        customer_id: req.body.customer_id || null, // Passar customer_id se fornecido
        items: items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity || 1,
        })),
        customer_email: customer.email.trim(),
        customer_name: customer.name || '',
        customer_phone: customer.phone || '',
        coupon_code,
        affiliate_code,
        metadata: {
          ip_address: Array.isArray(clientIp) ? clientIp[0] : clientIp,
          user_agent: userAgent,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          created_at: new Date().toISOString(),
        },
      });

      // Processar pagamento
      const payment = await OrderService.processPayment(order.id);

      // Buscar pedido completo com pagamento
      const orderWithPayment = await Order.findByPk(order.id, {
        include: [
          { association: 'items' },
          { association: 'payment' },
        ],
      });

      res.status(201).json({
        order: orderWithPayment,
        payment: {
          qr_code: payment.qr_code,
          qr_code_base64: payment.qr_code_base64,
          expiration_date: payment.expiration_date,
        },
      });
    } catch (error: any) {
      console.error('[ApiController] Error creating order:', error);
      res.status(400).json({ error: error.message || 'Erro ao criar pedido' });
    }
  }
}


