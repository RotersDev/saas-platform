import { Response } from 'express';
import { OrderService } from '../services/orderService';
import { Order, Payment } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { MercadoPagoService } from '../services/mercadoPagoService';

export class OrderController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const order = await OrderService.createOrder({
        store_id: req.store.id,
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
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { status, page = 1, limit = 20, search } = req.query;
      const { Op } = await import('sequelize');
      const { OrderItem } = await import('../models');

      const where: any = { store_id: req.store.id };
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

        // Buscar pedidos por cliente/ID
        const ordersByCustomer = await Order.findAll({
          where: {
            store_id: req.store.id,
            [Op.or]: searchConditions,
          },
          attributes: ['id'],
        });

        // Buscar pedidos por nome do produto
        const itemsByProduct = await OrderItem.findAll({
          where: {
            product_name: { [Op.iLike]: searchTerm },
          },
          attributes: ['order_id'],
          raw: true,
        });

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
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      await OrderService.deliverOrder(Number(req.params.id));

      res.json({ message: 'Pedido entregue com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancel(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const order = await Order.findOne({
        where: { id: req.params.id, store_id: req.store.id },
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
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const order = await Order.findOne({
        where: { id: req.params.id, store_id: req.store.id },
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

      // Verificar qual provider foi usado
      const provider = payment.metadata?.provider || 'mercado_pago';
      const transactionId = provider === 'pushin_pay'
        ? payment.pushin_pay_id
        : payment.mercado_pago_id;

      if (!transactionId) {
        res.status(400).json({ error: 'ID da transação não encontrado' });
        return;
      }

      // Apenas Pushin Pay suporta consulta manual por enquanto
      if (provider !== 'pushin_pay') {
        res.json({ paid: payment.status === 'approved', status: payment.status });
        return;
      }

      // Buscar método de pagamento configurado
      const { PaymentMethod } = require('../models');
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: req.store.id,
          provider: 'pushin_pay',
          enabled: true,
        },
      });

      if (!paymentMethod || !paymentMethod.token) {
        res.status(400).json({ error: 'Pushin Pay não configurado' });
        return;
      }

      // Consultar status no Pushin Pay
      const { PushinPayService } = require('../services/pushinPayService');
      const transaction = await PushinPayService.getTransaction(
        {
          token: paymentMethod.token,
          sandbox: paymentMethod.sandbox,
        },
        transactionId
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

        // Tentar entregar o pedido
        const { OrderService } = require('../services/orderService');
        try {
          await OrderService.deliverOrder(order.id);
        } catch (error) {
          // Ignorar erros de entrega
        }

        res.json({ paid: true, message: 'Pagamento confirmado' });
      } else {
        res.json({ paid: false, status: transaction.status });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao verificar pagamento' });
    }
  }

  static async refund(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const order = await Order.findOne({
        where: { id: req.params.id, store_id: req.store.id },
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
            await OrderService.deliverOrder(dbPaymentOrder.id);

            // Enviar notificações de pedido aprovado
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


