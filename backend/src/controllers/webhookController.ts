import { Request, Response } from 'express';
import { Payment, Order } from '../models';
import { PushinPayService } from '../services/pushinPayService';
import { PaymentMethod } from '../models';
import logger from '../config/logger';

export class WebhookController {
  /**
   * Processa webhook do Pushin Pay
   */
  static async pushinPay(req: Request, res: Response): Promise<void> {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        res.status(400).json({ error: 'Dados inválidos' });
        return;
      }

      // Buscar pagamento pelo ID da transação Pushin Pay
      const payment = await Payment.findOne({
        where: { pushin_pay_id: id },
        include: [{ model: Order, as: 'order' }],
      });

      if (!payment) {
        logger.warn('Pagamento não encontrado para webhook Pushin Pay', { id });
        res.status(404).json({ error: 'Pagamento não encontrado' });
        return;
      }

      // Mapear status do Pushin Pay para o status interno
      let paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' = 'pending';
      if (status === 'paid') {
        paymentStatus = 'approved';
      } else if (status === 'canceled') {
        paymentStatus = 'cancelled';
      }

      // Atualizar pagamento
      await payment.update({
        status: paymentStatus,
        metadata: {
          ...payment.metadata,
          webhook_received_at: new Date().toISOString(),
          pushin_pay_status: status,
        },
      });

      // Se pagamento foi aprovado, atualizar pedido e entregar
      const paymentOrder = (payment as any).order;
      if (paymentStatus === 'approved' && paymentOrder) {
        await paymentOrder.update({
          payment_status: 'paid',
          status: 'paid',
        });

        // Creditar na carteira após pagamento aprovado (Pushin Pay processa o pagamento)
        try {
          const { OrderService } = await import('../services/orderService');
          await OrderService.creditWalletAfterPayment(paymentOrder.id);
        } catch (walletError) {
          logger.error('Erro ao creditar carteira após pagamento', { error: walletError, orderId: paymentOrder.id });
        }

        // Entregar pedido automaticamente
        try {
          const { OrderService } = await import('../services/orderService');
          await OrderService.deliverOrder(paymentOrder.id);

          // Enviar email de aprovação
          try {
            const { Store, OrderItem } = await import('../models');
            const orderWithData = await Order.findByPk(paymentOrder.id, {
              include: [
                { model: Store, as: 'store' },
                { model: OrderItem, as: 'items' },
              ],
            });

            if (orderWithData) {
              const emailService = (await import('../services/emailService')).default;
              const productKeys = (orderWithData as any).items
                ?.map((item: any) => item.product_key)
                .filter((key: string) => key)
                .flatMap((key: string) => key.split('\n'))
                .filter((key: string) => key.trim()) || [];

              await emailService.sendOrderApproved(
                orderWithData.toJSON(),
                (orderWithData as any).store?.name || 'Loja',
                orderWithData.customer_email,
                productKeys
              );
            }
          } catch (emailError) {
            logger.error('Erro ao enviar email de pedido aprovado:', emailError);
          }
        } catch (error: any) {
          logger.error('Erro ao entregar pedido após pagamento', { error, orderId: paymentOrder.id });

          // Enviar webhooks de pedido aprovado mesmo se houver erro de entrega (pedido já foi pago)
          try {
            const { WebhookService } = await import('../services/webhookService');
            const orderWithItems = await Order.findByPk(paymentOrder.id, {
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
              await WebhookService.notifyOrderApprovedPrivate(paymentOrder.store_id, orderData);
              await WebhookService.notifyOrderApprovedPublic(paymentOrder.store_id, orderData);
            }
          } catch (webhookError) {
            logger.error('Erro ao enviar webhook de pedido aprovado após erro de entrega:', webhookError);
          }

          // Se o erro for de estoque insuficiente, o webhook já foi enviado em deliverOrder
          // Mas vamos garantir que seja enviado também aqui se necessário
          if (error?.message?.includes('Estoque insuficiente') || error?.message?.includes('estoque')) {
            try {
              const { OrderItem, Product } = await import('../models');
              const orderItems = await OrderItem.findAll({
                where: { order_id: paymentOrder.id },
                include: [{ model: Product, as: 'product' }],
              });

              for (const item of orderItems) {
                const product = (item as any).product;
                if (product && product.inventory_type === 'lines') {
                  const { ProductKey } = await import('../models');
                  const remainingKeys = await ProductKey.count({
                    where: { product_id: product.id },
                  });

                  if (remainingKeys === 0) {
                    const { WebhookService } = await import('../services/webhookService');
                    await WebhookService.notifyProductOutOfStock(paymentOrder.store_id, product.toJSON());
                  }
                }
              }
            } catch (webhookError) {
              logger.error('Erro ao enviar webhook de estoque esgotado após erro de entrega:', webhookError);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Erro ao processar webhook Pushin Pay', { error });
      res.status(500).json({ error: 'Erro ao processar webhook' });
    }
  }

  /**
   * Consulta status de uma transação Pushin Pay manualmente
   */
  static async checkPushinPayStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId, storeId } = req.body;

      if (!transactionId || !storeId) {
        res.status(400).json({ error: 'transactionId e storeId são obrigatórios' });
        return;
      }

      // Buscar método de pagamento
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: storeId,
          provider: 'pushin_pay',
          enabled: true,
        },
      });

      if (!paymentMethod || !paymentMethod.token) {
        res.status(404).json({ error: 'Método de pagamento Pushin Pay não encontrado' });
        return;
      }

      // Consultar status na API
      const transaction = await PushinPayService.getTransaction(
        {
          token: paymentMethod.token,
          sandbox: paymentMethod.sandbox,
        },
        transactionId
      );

      if (!transaction) {
        res.status(404).json({ error: 'Transação não encontrada' });
        return;
      }

      res.json(transaction);
    } catch (error: any) {
      logger.error('Erro ao consultar status Pushin Pay', { error });
      res.status(500).json({ error: error.message || 'Erro ao consultar status' });
    }
  }
}

