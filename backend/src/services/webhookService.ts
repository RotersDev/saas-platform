import axios from 'axios';
import { Notification } from '../models';
import logger from '../config/logger';

export class WebhookService {
  /**
   * Envia webhook do Discord
   */
  static async sendDiscordWebhook(webhookUrl: string, data: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
  }): Promise<boolean> {
    try {
      const embed = {
        title: data.title,
        description: data.description,
        color: data.color || 0x5865F2, // Discord blue
        fields: data.fields || [],
        footer: data.footer,
        timestamp: new Date().toISOString(),
      };

      await axios.post(webhookUrl, {
        embeds: [embed],
      }, {
        timeout: 5000,
      });

      return true;
    } catch (error: any) {
      logger.error('Erro ao enviar webhook do Discord:', {
        error: error.message,
        webhookUrl: webhookUrl.substring(0, 50) + '...',
      });
      return false;
    }
  }

  /**
   * Envia notificação de teste
   */
  static async sendTestWebhook(webhookUrl: string, type: string): Promise<boolean> {
    return this.sendDiscordWebhook(webhookUrl, {
      title: '✅ Webhook Configurado com Sucesso!',
      description: `Este é uma mensagem de teste do sistema de notificações.\n\n**Tipo:** ${type}\n\nSe você recebeu esta mensagem, significa que sua webhook está configurada corretamente!`,
      color: 0x00FF00, // Green
      footer: {
        text: 'Sistema de Notificações',
      },
    });
  }

  /**
   * Envia notificação quando pedido é criado
   */
  static async notifyOrderCreated(storeId: number, order: any): Promise<void> {
    try {
      const notifications = await Notification.findAll({
        where: {
          store_id: storeId,
          type: 'discord',
          event: 'order_created',
          enabled: true,
        },
      });

      if (notifications.length === 0) {
        logger.info('Nenhuma notificação configurada para pedido criado', { storeId });
        return;
      }

      for (const notification of notifications) {
        const webhookUrl = notification.config?.webhook_url;
        if (!webhookUrl) {
          logger.warn('Webhook URL não configurado para notificação', { notificationId: notification.id });
          continue;
        }

        const itemsList = order.items?.map((item: any) =>
          `• ${item.product_name} x${item.quantity} - R$ ${Number(item.total || item.price || 0).toFixed(2)}`
        ).join('\n') || 'Nenhum item';

        logger.info('Enviando webhook de pedido criado', {
          storeId,
          orderId: order.id,
          orderNumber: order.order_number,
          webhookUrl: webhookUrl.substring(0, 50) + '...'
        });

        const success = await this.sendDiscordWebhook(webhookUrl, {
          title: '🛒 Novo Pedido Criado',
          description: `Um novo pedido foi iniciado na sua loja.`,
          color: 0x3498DB, // Blue
          fields: [
            { name: '📦 Número do Pedido', value: order.order_number || `#${order.id}`, inline: true },
            { name: '👤 Cliente', value: order.customer_name || order.customer_email || 'N/A', inline: true },
            { name: '📧 E-mail', value: order.customer_email || 'N/A', inline: false },
            { name: '💰 Valor Total', value: `R$ ${Number(order.total || 0).toFixed(2)}`, inline: true },
            { name: '📋 Status', value: 'Pendente', inline: true },
            { name: '📦 Itens', value: itemsList || 'Nenhum item', inline: false },
          ],
          footer: {
            text: `Pedido #${order.order_number || order.id}`,
          },
        });

        if (success) {
          logger.info('Webhook de pedido criado enviado com sucesso', { storeId, orderId: order.id });
        } else {
          logger.warn('Falha ao enviar webhook de pedido criado', { storeId, orderId: order.id });
        }
      }
    } catch (error: any) {
      logger.error('Erro ao enviar notificação de pedido criado:', error);
    }
  }

  /**
   * Envia notificação quando pedido é aprovado (privado)
   */
  static async notifyOrderApprovedPrivate(storeId: number, order: any): Promise<void> {
    try {
      const notifications = await Notification.findAll({
        where: {
          store_id: storeId,
          type: 'discord',
          event: 'order_approved_private',
          enabled: true,
        },
      });

      for (const notification of notifications) {
        const webhookUrl = notification.config?.webhook_url;
        if (!webhookUrl) continue;

        const itemsList = order.items?.map((item: any) =>
          `• ${item.product_name} x${item.quantity}`
        ).join('\n') || 'Nenhum item';

        // Incluir chaves se disponíveis
        const keysList = order.items?.map((item: any) => {
          if (item.keys && item.keys.length > 0) {
            return `**${item.product_name}:**\n${item.keys.map((key: string) => `\`${key}\``).join('\n')}`;
          }
          return `**${item.product_name}:** Chaves não disponíveis`;
        }).join('\n\n') || 'Nenhuma chave disponível';

        await this.sendDiscordWebhook(webhookUrl, {
          title: '✅ Pedido Aprovado - Informações Privadas',
          description: `Um pedido foi aprovado e pago com sucesso.`,
          color: 0x00FF00, // Green
          fields: [
            { name: '📦 Número do Pedido', value: order.order_number, inline: true },
            { name: '👤 Cliente', value: order.customer_name || 'N/A', inline: true },
            { name: '📧 E-mail', value: order.customer_email, inline: false },
            { name: '💰 Valor Total', value: `R$ ${order.total.toFixed(2)}`, inline: true },
            { name: '💳 Método de Pagamento', value: order.payment_method || 'PIX', inline: true },
            { name: '📦 Itens', value: itemsList, inline: false },
            { name: '🔑 Chaves do Produto', value: keysList, inline: false },
          ],
          footer: {
            text: `Pedido #${order.order_number} - Informações Confidenciais`,
          },
        });
      }
    } catch (error: any) {
      logger.error('Erro ao enviar notificação de pedido aprovado (privado):', error);
    }
  }

  /**
   * Envia notificação quando pedido é aprovado (público)
   */
  static async notifyOrderApprovedPublic(storeId: number, order: any): Promise<void> {
    try {
      const notifications = await Notification.findAll({
        where: {
          store_id: storeId,
          type: 'discord',
          event: 'order_approved_public',
          enabled: true,
        },
      });

      for (const notification of notifications) {
        const webhookUrl = notification.config?.webhook_url;
        if (!webhookUrl) continue;

        const itemsList = order.items?.map((item: any) =>
          `• ${item.product_name} x${item.quantity}`
        ).join('\n') || 'Nenhum item';

        await this.sendDiscordWebhook(webhookUrl, {
          title: '✅ Pedido Aprovado',
          description: `Um pedido foi aprovado e pago com sucesso.`,
          color: 0x00FF00, // Green
          fields: [
            { name: '📦 Número do Pedido', value: order.order_number, inline: true },
            { name: '💰 Valor Total', value: `R$ ${order.total.toFixed(2)}`, inline: true },
            { name: '📦 Itens', value: itemsList, inline: false },
          ],
          footer: {
            text: `Pedido #${order.order_number}`,
          },
        });
      }
    } catch (error: any) {
      logger.error('Erro ao enviar notificação de pedido aprovado (público):', error);
    }
  }

  /**
   * Envia notificação quando produto fica sem estoque
   */
  static async notifyProductOutOfStock(storeId: number, product: any): Promise<void> {
    try {
      const notifications = await Notification.findAll({
        where: {
          store_id: storeId,
          type: 'discord',
          event: 'product_out_of_stock',
          enabled: true,
        },
      });

      for (const notification of notifications) {
        const webhookUrl = notification.config?.webhook_url;
        if (!webhookUrl) continue;

        await this.sendDiscordWebhook(webhookUrl, {
          title: '⚠️ Produto Sem Estoque',
          description: `O produto "${product.name}" ficou sem estoque.`,
          color: 0xFF9900, // Orange
          fields: [
            { name: '📦 Produto', value: product.name, inline: true },
            { name: '💰 Preço', value: `R$ ${(product.price || 0).toFixed(2)}`, inline: true },
            { name: '📊 Estoque Disponível', value: '0 unidades', inline: false },
          ],
          footer: {
            text: `Produto ID: ${product.id}`,
          },
        });
      }
    } catch (error: any) {
      logger.error('Erro ao enviar notificação de produto sem estoque:', error);
    }
  }
}
