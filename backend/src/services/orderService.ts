import { Order, OrderItem, Product, ProductKey, Customer, Coupon } from '../models';
import { v4 as uuidv4 } from 'uuid';
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

        // Verificar estoque apenas para produtos do tipo 'lines'
        if (product.inventory_type === 'lines') {
          const availableKeys = await ProductKey.count({
            where: { product_id: product.id },
          });

          if (availableKeys < item.quantity) {
            throw new Error(`Estoque insuficiente para o produto ${product.name}`);
          }
        }

        // Preço normal (o que realmente cobra) = price
        const price = product.price;
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
              (orderWithItems as any).store?.name || 'Loja',
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

      // Usar Pushin Pay como gateway (token da plataforma - lojistas não precisam configurar)
      return await this.processPaymentWithPushinPay(order, transaction);

      // Este código não será mais usado - sempre usa carteira
      // Mantido apenas para compatibilidade
    } catch (error: any) {
      await transaction?.rollback();
      logger.error('Erro ao processar pagamento', {
        error: error.message,
        orderId,
        service: 'saas-platform',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Processa pagamento usando a carteira como método padrão
   * Cria um QR Code PIX que será pago externamente e creditado na carteira
   */
  static async processWalletPayment(order: Order, transaction: any): Promise<any> {
    const { Wallet, Payment } = await import('../models');

    // Criar ou buscar carteira da loja
    let wallet = await Wallet.findOne({
      where: { store_id: order.store_id },
      transaction,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        store_id: order.store_id,
        available_balance: 0,
        retained_balance: 0,
      }, { transaction });
    }

    // Gerar QR Code PIX usando a chave PIX da loja (se configurada) ou uma chave padrão da plataforma
    // Por enquanto, vamos criar um QR code básico que será processado manualmente
    const pixKey = wallet.pix_key || process.env.PLATFORM_PIX_KEY || 'wallet@nerix.site';

    // Criar QR Code PIX básico (formato EMV simplificado)
    const amount = Number(order.total).toFixed(2);
    const qrCodeData = `00020126${pixKey.length.toString().padStart(2, '0')}${pixKey}52040000530398654${amount.length.toString().padStart(2, '0')}${amount}5802BR5925NERIX PLATAFORMA SAAS6009SAO PAULO62070503***6304`;

    // Criar QR Code Base64 (simulado - em produção, usar biblioteca de QR Code)
    const qrCodeBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    // Criar pagamento com status "pending" - será aprovado manualmente ou via webhook
    const paymentData: any = {
      order_id: order.id,
      status: 'pending',
      amount: order.total,
      payment_method: 'pix',
      pix_qr_code: qrCodeData,
      pix_qr_code_base64: qrCodeBase64,
      pix_expiration_date: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      metadata: {
        provider: 'wallet',
        wallet_id: wallet.id,
        pix_key: pixKey,
      },
    };

    const payment = await Payment.create(paymentData, { transaction });

    // Atualizar pedido
    await order.update(
      {
        payment_status: 'pending',
        status: 'pending',
      },
      { transaction }
    );

    await transaction?.commit();

    return {
      id: payment.id,
      status: 'pending',
      qr_code: qrCodeData,
      qr_code_base64: qrCodeBase64,
      expiration_date: paymentData.pix_expiration_date,
    };
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
          // Buscar chaves disponíveis (apenas para produtos do tipo 'lines')
          if (product.inventory_type === 'lines') {
            const keys = await ProductKey.findAll({
              where: { product_id: product.id },
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

            // Deletar chaves (não marcar como usadas, deletar completamente)
            const keyValues = keys.map((k) => k.key).join('\n');
            await ProductKey.destroy({
              where: { id: keys.map((k) => k.id) },
              transaction,
            });

            // Atualizar item com a chave
            await OrderItem.update(
              { product_key: keyValues },
              { where: { id: item.id }, transaction }
            );

            // Verificar se o produto ficou sem estoque após a entrega
            const remainingKeys = await ProductKey.count({
              where: { product_id: product.id },
              transaction,
            });

            // Se não há mais estoque, notificar
            if (remainingKeys === 0) {
              try {
                const { WebhookService } = await import('./webhookService');
                await WebhookService.notifyProductOutOfStock(order.store_id, product.toJSON());
              } catch (error) {
                logger.error('Erro ao enviar webhook de produto sem estoque:', error);
              }
            }
          } else {
            // Para produtos do tipo 'text' ou 'file', não precisa de chaves
            // A entrega será feita via email com o conteúdo configurado
            // Não precisa atualizar product_key
          }
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

      // Enviar webhooks de pedido aprovado após entrega bem-sucedida
      try {
        const { WebhookService } = await import('./webhookService');
        const orderWithItems = await Order.findByPk(order.id, {
          include: [{ model: OrderItem, as: 'items' }],
        });

        if (orderWithItems) {
          const orderData = (orderWithItems as any).toJSON();
          // Adicionar chaves aos itens se disponíveis
          if (orderData.items) {
            for (const item of orderData.items) {
              if (item.product_key) {
                item.keys = item.product_key.split('\n').filter((k: string) => k.trim());
              }
            }
          }
          await WebhookService.notifyOrderApprovedPrivate(order.store_id, orderData);
          await WebhookService.notifyOrderApprovedPublic(order.store_id, orderData);
        }
      } catch (webhookError) {
        logger.error('Erro ao enviar webhook de pedido aprovado após entrega:', webhookError);
      }

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      logger.error('Erro ao entregar pedido', { error, orderId });
      throw error;
    }
  }

  /**
   * Processa pagamento usando Pushin Pay como gateway (token da plataforma)
   * Lojistas não precisam configurar - tudo é transparente para eles
   * Quando aprovado, credita na carteira do lojista
   */
  static async processPaymentWithPushinPay(order: Order, transaction: any): Promise<any> {
    const { Payment, SplitConfig } = await import('../models');
    const { PushinPayService } = await import('./pushinPayService');

    // Token do Pushin Pay da plataforma (configurado no .env)
    const platformToken = process.env.PUSHIN_PAY_TOKEN;
    const sandbox = process.env.PUSHIN_PAY_SANDBOX === 'true';

    if (!platformToken) {
      throw new Error('Token do Pushin Pay não configurado na plataforma. Configure PUSHIN_PAY_TOKEN no .env');
    }

    // Buscar configuração de split para calcular a porcentagem da plataforma
    const splitConfig = await SplitConfig.findOne({
      where: { store_id: order.store_id, is_active: true },
      transaction,
    });

    const amountInCents = Math.round(Number(order.total) * 100);

    // Calcular splits (plataforma recebe sua porcentagem)
    let splitRules: Array<{ value: number; account_id: string }> = [];
    if (splitConfig) {
      try {
        splitRules = PushinPayService.calculateSplits(amountInCents, splitConfig);
      } catch (error: any) {
        logger.warn('Erro ao calcular splits Pushin Pay', { error: error.message });
      }
    }

    // Criar webhook URL
    const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/pushin-pay`;

    // Criar PIX no Pushin Pay usando token da plataforma
    const pushinPayResponse = await PushinPayService.createPix(
      {
        token: platformToken,
        sandbox: sandbox,
      },
      {
        value: amountInCents,
        webhook_url: webhookUrl,
        split_rules: splitRules,
      }
    );

    // Salvar pagamento
    const paymentData: any = {
      order_id: order.id,
      status: pushinPayResponse.status === 'paid' ? 'approved' : 'pending',
      amount: order.total,
      payment_method: 'pix',
      pix_qr_code: pushinPayResponse.qr_code,
      pix_qr_code_base64: pushinPayResponse.qr_code_base64,
      pix_expiration_date: null,
      split_data: splitRules,
      pushin_pay_id: pushinPayResponse.id,
      metadata: {
        provider: 'pushin_pay',
        sandbox: sandbox,
        platform_token: true, // Indica que usou token da plataforma
      },
    };

    await Payment.create(paymentData, { transaction });

    // Atualizar pedido
    await order.update(
      {
        payment_id: pushinPayResponse.id,
        payment_status: pushinPayResponse.status === 'paid' ? 'paid' : 'pending',
        status: pushinPayResponse.status === 'paid' ? 'paid' : 'pending',
      },
      { transaction }
    );

    await transaction?.commit();

    return {
      id: pushinPayResponse.id,
      status: pushinPayResponse.status === 'paid' ? 'approved' : 'pending',
      qr_code: pushinPayResponse.qr_code,
      qr_code_base64: pushinPayResponse.qr_code_base64,
      expiration_date: null,
    };
  }

  /**
   * Credita valor na carteira do lojista após pagamento aprovado
   * Aplica taxas: R$ 0.70 (gateway) + 3% (plataforma)
   */
  static async creditWalletAfterPayment(orderId: number): Promise<void> {
    const transaction = await Order.sequelize?.transaction();

    try {
      const { Wallet, Order: OrderModel } = await import('../models');

      const order = await OrderModel.findByPk(orderId, {
        include: [{ association: 'payment' }],
        transaction,
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      const payment = (order as any).payment;
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      // Verificar se já foi creditado
      if (payment.metadata?.wallet_credited === true) {
        logger.info('Carteira já foi creditada para este pagamento', { orderId });
        await transaction?.commit();
        return;
      }

      // Buscar carteira
      const wallet = await Wallet.findOne({
        where: { store_id: order.store_id },
        transaction,
      });

      if (!wallet) {
        throw new Error('Carteira não encontrada');
      }

      const orderTotal = Number(order.total);

      // Calcular taxas
      const gatewayFee = 0.70; // Taxa fixa do gateway
      const platformFeePercentage = 0.03; // 3% da plataforma
      const platformFee = orderTotal * platformFeePercentage;
      const totalFees = gatewayFee + platformFee;

      // Valor líquido para o lojista
      const netAmount = orderTotal - totalFees;

      // Creditar na carteira (saldo disponível)
      const currentAvailableBalance = parseFloat(wallet.available_balance.toString());
      const newBalance = currentAvailableBalance + netAmount;

      await wallet.update({
        available_balance: newBalance,
      }, { transaction });

      // Marcar pagamento como creditado e salvar transação nos metadados
      await payment.update({
        metadata: {
          ...payment.metadata,
          wallet_credited: true,
          credited_at: new Date().toISOString(),
          fees: {
            gateway_fee: gatewayFee,
            platform_fee: platformFee,
            total_fees: totalFees,
            net_amount: netAmount,
          },
          transaction: {
            type: 'credit',
            amount: netAmount,
            previous_balance: currentAvailableBalance,
            new_balance: newBalance,
            order_id: order.id,
            order_number: (order as any).order_number || order.id.toString(),
          },
        },
      }, { transaction });

      logger.info('Carteira creditada com sucesso', {
        orderId,
        orderTotal,
        netAmount,
        fees: totalFees,
        walletId: wallet.id,
      });

      await transaction?.commit();
    } catch (error: any) {
      await transaction?.rollback();
      logger.error('Erro ao creditar carteira', {
        error: error.message,
        orderId,
      });
      throw error;
    }
  }
}


