import { Order, OrderItem, Product, ProductKey, Customer, Coupon, PaymentMethod } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoService } from './mercadoPagoService';
import { PushinPayService } from './pushinPayService';
import { SplitConfig } from '../models';
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import logger from '../config/logger';

export class OrderService {
  static async createOrder(data: {
    store_id: number;
    customer_id?: number | null;
    items: Array<{ product_id: number; quantity: number }>;
    customer_email: string;
    customer_name: string;
    customer_phone?: string;
    coupon_code?: string;
    affiliate_code?: string;
    metadata?: Record<string, any>; // IP, user agent, etc
  }): Promise<Order> {
    const transaction = await Order.sequelize?.transaction();

    try {
      // Calcular totais
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of data.items) {
        const product = await Product.findOne({
          where: { id: item.product_id, store_id: data.store_id, is_active: true },
        });

        if (!product) {
          throw new Error(`Produto ${item.product_id} não encontrado`);
        }

        // Verificar estoque
        const availableKeys = await ProductKey.count({
          where: { product_id: product.id, is_used: false },
        });

        if (availableKeys < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto ${product.name}`);
        }

        const price = product.promotional_price || product.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity,
          price,
          total: itemTotal,
        });
      }

      // Aplicar cupom
      let discount = 0;
      let coupon_id: number | undefined;

      if (data.coupon_code) {
        const coupon = await Coupon.findOne({
          where: {
            code: data.coupon_code,
            store_id: data.store_id,
            is_active: true,
          },
        });

        if (coupon) {
          const now = new Date();
          if (
            now >= coupon.valid_from &&
            now <= coupon.valid_until &&
            (!coupon.usage_limit || coupon.usage_count < coupon.usage_limit)
          ) {
            if (coupon.type === 'percentage') {
              discount = (subtotal * Number(coupon.value)) / 100;
              if (coupon.max_discount && discount > Number(coupon.max_discount)) {
                discount = Number(coupon.max_discount);
              }
            } else {
              discount = Number(coupon.value);
            }

            coupon_id = coupon.id;
          }
        }
      }

      const total = subtotal - discount;

      // Criar ou buscar cliente
      let customer;

      // Se customer_id foi fornecido, usar esse cliente
      if (data.customer_id) {
        customer = await Customer.findOne({
          where: { id: data.customer_id, store_id: data.store_id },
        });
        if (!customer) {
          throw new Error('Cliente não encontrado');
        }
      } else {
        // Buscar por email ou criar novo
        customer = await Customer.findOne({
          where: { store_id: data.store_id, email: data.customer_email },
        });

        if (!customer) {
          customer = await Customer.create(
            {
              store_id: data.store_id,
              email: data.customer_email,
              name: data.customer_name,
              phone: data.customer_phone,
              is_blocked: false,
              total_orders: 0,
              total_spent: 0,
            },
            { transaction }
          );
        }
      }

      // Criar pedido
      const order = await Order.create(
        {
          store_id: data.store_id,
          customer_id: customer.id,
          order_number: `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`,
          status: 'pending',
          subtotal,
          discount,
          total,
          coupon_id,
          affiliate_code: data.affiliate_code,
          customer_email: data.customer_email,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          payment_method: 'pix',
          payment_status: 'pending',
          metadata: data.metadata || {},
        },
        { transaction }
      );

      // Criar itens do pedido
      for (const item of orderItems) {
        await OrderItem.create(
          {
            order_id: order.id,
            ...item,
          },
          { transaction }
        );
      }

      // Atualizar uso do cupom
      if (coupon_id) {
        await Coupon.increment('usage_count', {
          where: { id: coupon_id },
          transaction,
        });
      }

      await transaction?.commit();

      // Enviar notificação de pedido criado
      try {
        const { WebhookService } = await import('./webhookService');
        const { OrderItem, Store } = await import('../models');
        const orderWithItems = await Order.findByPk(order.id, {
          include: [
            {
              model: OrderItem,
              as: 'items',
              attributes: ['id', 'product_name', 'quantity', 'price', 'total'],
            },
            {
              model: Store,
              as: 'store',
            },
          ],
        });
        if (orderWithItems) {
          await WebhookService.notifyOrderCreated(data.store_id, orderWithItems.toJSON());

          // Enviar email para o cliente
          try {
            const emailService = (await import('./emailService')).default;
            await emailService.sendOrderCreated(
              orderWithItems.toJSON(),
              orderWithItems.store?.name || 'Loja',
              data.customer_email
            );
          } catch (emailError) {
            logger.error('Erro ao enviar email de pedido criado:', emailError);
          }
        }
      } catch (error) {
        // Não falhar se webhook falhar
        logger.error('Erro ao enviar webhook de pedido criado:', error);
      }

      return order;
    } catch (error) {
      await transaction?.rollback();
      logger.error('Erro ao criar pedido', { error, data });
      throw error;
    }
  }

  static async processPayment(orderId: number): Promise<any> {
    const transaction = await Order.sequelize?.transaction();

    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Buscar método de pagamento ativo
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: order.store_id,
          enabled: true,
        },
        order: [['provider', 'ASC']], // Priorizar Pushin Pay se ambos estiverem ativos
        transaction,
      });

      if (!paymentMethod) {
        throw new Error('Nenhum método de pagamento configurado');
      }

      // Buscar configuração de split
      const splitConfig = await SplitConfig.findOne({
        where: { store_id: order.store_id, is_active: true },
        transaction,
      });

      const amountInCents = Math.round(Number(order.total) * 100); // Converter para centavos

      let paymentResponse: any;
      let splitData: any[] = [];

      if (paymentMethod.provider === 'pushin_pay') {
        if (!paymentMethod.token) {
          throw new Error('Token do Pushin Pay não configurado');
        }

        // Calcular splits para Pushin Pay
        // O split é configurado no SplitConfig com os account_ids (incluindo o da plataforma)
        let splitRules: Array<{ value: number; account_id: string }> = [];
        if (splitConfig) {
          try {
            // Calcular splits usando os account_ids configurados no SplitConfig
            splitRules = PushinPayService.calculateSplits(
              amountInCents,
              splitConfig
            );
          } catch (error: any) {
            logger.warn('Erro ao calcular splits Pushin Pay', { error: error.message });
            // Continuar sem split se houver erro
          }
        }

        // Criar webhook URL
        const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/pushin-pay`;

        // Criar PIX no Pushin Pay
        const pushinPayResponse = await PushinPayService.createPix(
          {
            token: paymentMethod.token,
            sandbox: paymentMethod.sandbox,
          },
          {
            value: amountInCents,
            webhook_url: webhookUrl,
            split_rules: splitRules,
          }
        );

        paymentResponse = {
          id: pushinPayResponse.id,
          status: pushinPayResponse.status === 'paid' ? 'approved' : 'pending',
          qr_code: pushinPayResponse.qr_code,
          qr_code_base64: pushinPayResponse.qr_code_base64,
          expiration_date: null, // Pushin Pay não retorna expiration_date diretamente
        };

        splitData = splitRules;
      } else if (paymentMethod.provider === 'mercado_pago') {
        if (!splitConfig) {
          throw new Error('Configuração de split não encontrada');
        }

        // Criar pagamento no Mercado Pago
        paymentResponse = await MercadoPagoService.createPixPayment({
          amount: Number(order.total),
          description: `Pedido ${order.order_number}`,
          payerEmail: order.customer_email,
          payerName: order.customer_name,
          orderId: order.id,
          splitConfig,
        });

        splitData = MercadoPagoService.calculateSplits(Number(order.total), splitConfig);
      } else {
        throw new Error(`Método de pagamento ${paymentMethod.provider} não suportado`);
      }

      // Salvar pagamento
      const { Payment } = await import('../models');
      const paymentData: any = {
        order_id: order.id,
        status: paymentResponse.status as any,
        amount: order.total,
        payment_method: 'pix',
        pix_qr_code: paymentResponse.qr_code,
        pix_qr_code_base64: paymentResponse.qr_code_base64,
        pix_expiration_date: paymentResponse.expiration_date,
        split_data: splitData,
        metadata: {
          provider: paymentMethod.provider,
          sandbox: paymentMethod.sandbox,
        },
      };

      // Salvar ID no campo correto conforme o provider
      if (paymentMethod.provider === 'pushin_pay') {
        paymentData.pushin_pay_id = paymentResponse.id;
      } else if (paymentMethod.provider === 'mercado_pago') {
        paymentData.mercado_pago_id = paymentResponse.id;
      }

      await Payment.create(paymentData, { transaction });

      // Atualizar pedido
      await order.update(
        {
          payment_id: paymentResponse.id,
          payment_status: paymentResponse.status as any,
        },
        { transaction }
      );

      await transaction?.commit();

      return paymentResponse;
    } catch (error) {
      await transaction?.rollback();
      logger.error('Erro ao processar pagamento', { error, orderId });
      throw error;
    }
  }

  static async deliverOrder(orderId: number): Promise<void> {
    const transaction = await Order.sequelize?.transaction();

    try {
      const order = await Order.findByPk(orderId, {
        include: [{ association: 'items', include: [{ association: 'product' }] }],
        transaction,
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      if (order.status !== 'paid') {
        throw new Error('Pedido não está pago');
      }

      // Entregar produtos
      for (const item of (order as any).items) {
        const product = item.product;
        if (product.delivery_type === 'instant') {
          // Buscar chaves disponíveis
          const keys = await ProductKey.findAll({
            where: { product_id: product.id, is_used: false },
            limit: item.quantity,
            transaction,
          });

          if (keys.length < item.quantity) {
            // Notificar produto sem estoque antes de lançar erro
            try {
              const { WebhookService } = await import('./webhookService');
              await WebhookService.notifyProductOutOfStock(order.store_id, product.toJSON());
            } catch (error) {
              logger.error('Erro ao enviar webhook de produto sem estoque:', error);
            }
            throw new Error(`Estoque insuficiente para ${product.name}`);
          }

          // Marcar chaves como usadas
          const keyValues = keys.map((k) => k.key).join('\n');
          await ProductKey.update(
            { is_used: true, used_at: new Date(), order_id: order.id },
            {
              where: { id: keys.map((k) => k.id) },
              transaction,
            }
          );

          // Atualizar item com a chave
          await OrderItem.update(
            { product_key: keyValues },
            { where: { id: item.id }, transaction }
          );
        }
      }

      // Atualizar pedido
      await order.update(
        {
          status: 'delivered',
          delivered_at: new Date(),
        },
        { transaction }
      );

      // Atualizar contadores
      await Product.increment('sales_count', {
        where: { id: (order as any).items.map((i: any) => i.product_id) },
        transaction,
      });

      await Customer.increment('total_orders', {
        where: { id: order.customer_id },
        transaction,
      });

      await Customer.increment('total_spent', {
        by: Number(order.total),
        where: { id: order.customer_id },
        transaction,
      });

      await Customer.update(
        { last_order_at: new Date() },
        { where: { id: order.customer_id }, transaction }
      );

      // Enviar email de aprovação após entrega
      try {
        const { Store, OrderItem } = await import('../models');
        const orderWithData = await Order.findByPk(order.id, {
          include: [
            { model: Store, as: 'store' },
            { model: OrderItem, as: 'items' },
          ],
        });

        if (orderWithData) {
          const emailService = (await import('./emailService')).default;
          const productKeys = orderWithData.items
            ?.map((item: any) => item.product_key)
            .filter((key: string) => key)
            .flatMap((key: string) => key.split('\n'))
            .filter((key: string) => key.trim()) || [];

          await emailService.sendOrderApproved(
            orderWithData.toJSON(),
            orderWithData.store?.name || 'Loja',
            orderWithData.customer_email,
            productKeys
          );
        }
      } catch (emailError) {
        logger.error('Erro ao enviar email de pedido aprovado:', emailError);
      }

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      logger.error('Erro ao entregar pedido', { error, orderId });
      throw error;
    }
  }
}


