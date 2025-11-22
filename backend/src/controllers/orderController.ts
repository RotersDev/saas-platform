import { Response } from 'express';
import { OrderService } from '../services/orderService';
import { Order, Payment } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { MercadoPagoService } from '../services/mercadoPagoService';

export class OrderController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const order = await OrderService.createOrder({
        store_id: storeId,
        ...req.body,
      });

      // Processar pagamento
      const payment = await OrderService.processPayment(order.id);

      res.status(201).json({
        order,
        payment: {
          qr_code: payment.qr_code,
          qr_code_base64: payment.qr_code_base64,
          expiration_date: payment.expiration_date,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA: Garantir que req.store existe e tem ID válido
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const { status, page = 1, limit = 20, search } = req.query;
      const { Op } = await import('sequelize');
      const { OrderItem } = await import('../models');

      // SEMPRE filtrar por store_id - CRÍTICO para isolamento de dados
      const where: any = { store_id: storeId };
      if (status) {
        where.status = status;
      }

      // Busca por email, nome do cliente, ID do pedido ou nome do produto
      if (search) {
        const searchTerm = `%${search}%`;
        const searchConditions: any[] = [
          { customer_email: { [Op.iLike]: searchTerm } },
          { customer_name: { [Op.iLike]: searchTerm } },
          { order_number: { [Op.iLike]: searchTerm } },
        ];

        // Se for número, buscar por ID também
        if (!isNaN(Number(search))) {
          searchConditions.push({ id: Number(search) });
        }

        // Buscar pedidos por cliente/ID - CRÍTICO: sempre filtrar por store_id
        const ordersByCustomer = await Order.findAll({
          where: {
            store_id: storeId, // Usar storeId validado
            [Op.or]: searchConditions,
          },
          attributes: ['id'],
        });

        // Buscar pedidos por nome do produto - CRÍTICO: filtrar por store_id primeiro
        const { Product } = await import('../models');
        const products = await Product.findAll({
          where: {
            store_id: storeId, // Usar storeId validado
            name: { [Op.iLike]: searchTerm },
          },
          attributes: ['id'],
          raw: true,
        });

        const productIds = products.map((p: any) => p.id);

        // Buscar order_ids da loja primeiro para garantir isolamento total
        const storeOrders = await Order.findAll({
          where: { store_id: storeId }, // Usar storeId validado
          attributes: ['id'],
          raw: true,
        });
        const storeOrderIds = storeOrders.map((o: any) => o.id);

        // Só buscar OrderItems se houver produtos e pedidos da loja
        const itemsByProduct = productIds.length > 0 && storeOrderIds.length > 0 ? await OrderItem.findAll({
          where: {
            product_id: { [Op.in]: productIds },
            order_id: { [Op.in]: storeOrderIds } // Garantir que só busca items de pedidos desta loja
          },
          attributes: ['order_id'],
          raw: true,
        }) : [];

        // Extrair order_ids únicos
        const productOrderIds = [...new Set(itemsByProduct.map((i: any) => i.order_id))];

        const orderIds = [
          ...ordersByCustomer.map((o: any) => o.id),
          ...productOrderIds,
        ];

        if (orderIds.length > 0) {
          where.id = { [Op.in]: [...new Set(orderIds)] };
        } else {
          // Nenhum resultado encontrado
          res.json({ rows: [], count: 0 });
          return;
        }
      }

      const orders = await Order.findAndCountAll({
        where,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
        include: [
          { association: 'items' },
          { association: 'customer' },
          { association: 'payment' },
        ],
      });

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const orderNumber = decodeURIComponent(req.params.orderNumber || req.params.id || '');

      if (!orderNumber) {
        res.status(400).json({ error: 'Número do pedido é obrigatório' });
        return;
      }

      // Buscar APENAS por order_number (UUID) - mais seguro
      const order = await Order.findOne({
        where: {
          store_id: storeId,
          order_number: orderNumber,
        },
        include: [
          { association: 'items' },
          { association: 'customer' },
          { association: 'payment' },
        ],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  }

  static async deliver(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const orderNumber = decodeURIComponent(req.params.orderNumber || req.params.id || '');

      if (!orderNumber) {
        res.status(400).json({ error: 'Número do pedido é obrigatório' });
        return;
      }

      // Verificar se o pedido pertence à loja antes de entregar
      const order = await Order.findOne({
        where: { order_number: orderNumber, store_id: storeId },
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado ou não pertence a esta loja' });
        return;
      }

      await OrderService.deliverOrder(order.id);

      res.json({ message: 'Pedido entregue com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancel(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const orderNumber = decodeURIComponent(req.params.orderNumber || req.params.id || '');

      if (!orderNumber) {
        res.status(400).json({ error: 'Número do pedido é obrigatório' });
        return;
      }

      const order = await Order.findOne({
        where: { order_number: orderNumber, store_id: storeId },
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      if (order.status === 'delivered') {
        res.status(400).json({ error: 'Não é possível cancelar pedido entregue' });
        return;
      }

      await order.update({
        status: 'cancelled',
        cancelled_at: new Date(),
      });

      res.json({ message: 'Pedido cancelado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao cancelar pedido' });
    }
  }

  static async checkPayment(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const orderNumber = decodeURIComponent(req.params.orderNumber || req.params.id || '');

      if (!orderNumber) {
        res.status(400).json({ error: 'Número do pedido é obrigatório' });
        return;
      }

      const order = await Order.findOne({
        where: { order_number: orderNumber, store_id: storeId },
        include: [{ association: 'payment' }],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      const payment = (order as any).payment;
      if (!payment) {
        res.status(400).json({ error: 'Pagamento não encontrado' });
        return;
      }

      // Se já está aprovado, retornar direto
      if (payment.status === 'approved' && order.payment_status === 'paid') {
        res.json({ paid: true, status: payment.status });
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

          if (!transaction) {
            res.json({ paid: false, message: 'Transação não encontrada' });
            return;
          }

          // Atualizar status se necessário
          if (transaction.status === 'paid' && order.payment_status !== 'paid') {
            await payment.update({ status: 'approved' });
            await order.update({
              status: 'paid',
              payment_status: 'paid',
            });

            // Creditar na carteira após pagamento aprovado
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
            } catch (error) {
              console.error('Erro ao entregar pedido:', error);
            }

            res.json({ paid: true, message: 'Pagamento confirmado!' });
          } else {
            res.json({ paid: transaction.status === 'paid', status: transaction.status });
          }
        } catch (error: any) {
          console.error('Erro ao consultar Pushin Pay:', error);
          res.json({
            paid: payment.status === 'approved',
            status: payment.status,
            message: 'Erro ao consultar status'
          });
        }
      } else {
        // Para outros métodos, retornar status atual
        res.json({ paid: payment.status === 'approved', status: payment.status });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao verificar pagamento' });
    }
  }

  static async refund(req: TenantRequest, res: Response): Promise<void> {
    try {
      // VERIFICAÇÃO CRÍTICA
      if (!req.store || !req.store.id) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const storeId = Number(req.store.id);
      if (isNaN(storeId) || storeId <= 0) {
        res.status(400).json({ error: 'ID da loja inválido' });
        return;
      }

      const orderNumber = decodeURIComponent(req.params.orderNumber || req.params.id || '');

      if (!orderNumber) {
        res.status(400).json({ error: 'Número do pedido é obrigatório' });
        return;
      }

      const order = await Order.findOne({
        where: { order_number: orderNumber, store_id: storeId },
        include: [{ association: 'payment' }],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      if (order.payment_status !== 'paid') {
        res.status(400).json({ error: 'Apenas pedidos pagos podem ser reembolsados' });
        return;
      }

      if (order.status === 'refunded') {
        res.status(400).json({ error: 'Pedido já foi reembolsado' });
        return;
      }

      const payment = (order as any).payment;
      if (!payment) {
        res.status(400).json({ error: 'Pagamento não encontrado' });
        return;
      }

      // Implementar lógica de reembolso conforme gateway
      // Por enquanto, apenas atualizar status
      await order.update({
        status: 'refunded',
        payment_status: 'refunded',
      });

      await payment.update({
        status: 'refunded',
      });

      res.json({ message: 'Reembolso processado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao processar reembolso' });
    }
  }

  static async webhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as { type?: string; data?: any };
      const { type, data } = body;

      if (type === 'payment') {
        const payment = await MercadoPagoService.getPayment(data.id);
        const dbPayment = await Payment.findOne({
          where: { mercado_pago_id: data.id },
          include: [{ association: 'order' }],
        });

        if (dbPayment && payment.status) {
          await dbPayment.update({ status: payment.status as any });

          const dbPaymentOrder = (dbPayment as any).order;
          if (payment.status === 'approved' && dbPaymentOrder) {
            await dbPaymentOrder.update({
              payment_status: 'paid',
              status: 'paid',
            });

            // Entregar automaticamente se for entrega instantânea
            try {
              await OrderService.deliverOrder(dbPaymentOrder.id);
            } catch (deliveryError: any) {
              // Se houver erro de estoque, verificar e enviar webhook
              if (deliveryError?.message?.includes('Estoque insuficiente') || deliveryError?.message?.includes('estoque')) {
                try {
                  const { OrderItem, Product, ProductKey } = await import('../models');
                  const orderItems = await OrderItem.findAll({
                    where: { order_id: dbPaymentOrder.id },
                    include: [{ model: Product, as: 'product' }],
                  });

                  for (const item of orderItems) {
                    const product = (item as any).product;
                    if (product && product.inventory_type === 'lines') {
                      const remainingKeys = await ProductKey.count({
                        where: { product_id: product.id },
                      });

                      if (remainingKeys === 0) {
                        const { WebhookService } = await import('../services/webhookService');
                        await WebhookService.notifyProductOutOfStock(dbPaymentOrder.store_id, product.toJSON());
                      }
                    }
                  }
                } catch (webhookError) {
                  console.error('Erro ao enviar webhook de estoque esgotado:', webhookError);
                }
              }
              // Continuar mesmo com erro de entrega para enviar webhook de pedido aprovado
            }

            // Enviar notificações de pedido aprovado (mesmo se houve erro de entrega)
            try {
              const { WebhookService } = await import('../services/webhookService');
              const orderWithItems = await dbPaymentOrder.reload({
                include: [{ association: 'items' }],
              });
              if (orderWithItems) {
                const orderData = orderWithItems.toJSON();
                // Adicionar chaves aos itens se disponíveis
                if (orderData.items) {
                  for (const item of orderData.items) {
                    if (item.product_key) {
                      item.keys = item.product_key.split('\n').filter((k: string) => k.trim());
                    }
                  }
                }
                await WebhookService.notifyOrderApprovedPrivate(orderWithItems.store_id, orderData);
                await WebhookService.notifyOrderApprovedPublic(orderWithItems.store_id, orderData);
              }
            } catch (error) {
              // Não falhar se webhook falhar
              console.error('Erro ao enviar webhook de pedido aprovado:', error);
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }
}


