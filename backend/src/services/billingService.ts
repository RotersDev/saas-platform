import { Store, Invoice } from '../models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export class BillingService {
  static async generateMonthlyInvoices(): Promise<void> {
    try {
      const activeStores = await Store.findAll({
        where: {
          status: { [Op.in]: ['active', 'trial'] },
        },
        include: [{ association: 'plan' }],
      });

      for (const store of activeStores) {
        try {
          // Verificar se já existe fatura pendente para este mês
          const existingInvoice = await Invoice.findOne({
            where: {
              store_id: store.id,
              status: 'pending',
              due_date: {
                [Op.gte]: new Date(),
              },
            },
          });

          if (existingInvoice) {
            continue;
          }

          const plan = (store as any).plan;
          if (!plan) {
            logger.warn(`Loja ${store.id} sem plano associado`);
            continue;
          }

          // Calcular data de vencimento (30 dias a partir de hoje)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          // Criar fatura
          const invoice = await Invoice.create({
            store_id: store.id,
            plan_id: plan.id,
            amount: Number(plan.price),
            status: 'pending',
            due_date: dueDate,
            billing_cycle: plan.billing_cycle,
          });

          logger.info(`Fatura criada para loja ${store.id}`, { invoiceId: invoice.id });

          // Disparar webhook
          // Webhook para invoice.created removido - usar notificações do Discord
          // await WebhookService.triggerWebhook(store.id, 'invoice.created', {
          //   invoice_id: invoice.id,
          //   store_id: store.id,
          //   amount: invoice.amount,
          //   due_date: invoice.due_date,
          // });
        } catch (error: any) {
          logger.error(`Erro ao gerar fatura para loja ${store.id}`, { error: error.message });
        }
      }
    } catch (error: any) {
      logger.error('Erro ao gerar faturas mensais', { error: error.message });
      throw error;
    }
  }

  static async checkOverdueInvoices(): Promise<void> {
    try {
      const overdueInvoices = await Invoice.findAll({
        where: {
          status: 'pending',
          due_date: {
            [Op.lt]: new Date(),
          },
        },
        include: [{ association: 'store' }],
      });

      for (const invoice of overdueInvoices) {
        const store = (invoice as any).store;
        if (!store) continue;

        // Suspender loja se a fatura estiver vencida há mais de 7 dias
        const daysOverdue = Math.floor(
          (Date.now() - invoice.due_date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOverdue > 7 && store.status === 'active') {
          await store.update({ status: 'suspended' });

          logger.info(`Loja ${store.id} suspensa por fatura vencida`, {
            invoiceId: invoice.id,
            daysOverdue,
          });

          // await WebhookService.triggerWebhook(store.id, 'store.suspended', {
          //   store_id: store.id,
          //   invoice_id: invoice.id,
          //   reason: 'invoice_overdue',
          // });
        }
      }
    } catch (error: any) {
      logger.error('Erro ao verificar faturas vencidas', { error: error.message });
      throw error;
    }
  }

  static async processInvoicePayment(invoiceId: number, paymentId: string): Promise<void> {
    try {
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [{ association: 'store' }],
      });

      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      // Atualizar fatura
      await invoice.update({
        status: 'paid',
        paid_at: new Date(),
        payment_id: paymentId,
      });

      const store = (invoice as any).store;
      if (store && store.status === 'suspended') {
        // Reativar loja
        await store.update({ status: 'active' });

        logger.info(`Loja ${store.id} reativada após pagamento`, {
          invoiceId: invoice.id,
        });

        // await WebhookService.triggerWebhook(store.id, 'store.activated', {
        //   store_id: store.id,
        //   invoice_id: invoice.id,
        // });
      }

      // await WebhookService.triggerWebhook(store.id, 'invoice.paid', {
      //   invoice_id: invoice.id,
      //   store_id: store.id,
      //   payment_id: paymentId,
      // });
    } catch (error: any) {
      logger.error('Erro ao processar pagamento de fatura', {
        error: error.message,
        invoiceId,
      });
      throw error;
    }
  }
}


