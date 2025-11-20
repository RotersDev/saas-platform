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

      // Buscar pagamento pelo ID da transação
      const payment = await Payment.findOne({
        where: { mercado_pago_id: id },
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
        } catch (error) {
          logger.error('Erro ao entregar pedido após pagamento', { error, orderId: paymentOrder.id });
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

