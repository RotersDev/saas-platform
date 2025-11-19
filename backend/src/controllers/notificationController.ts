import { Response } from 'express';
import { Notification } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class NotificationController {
  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const notifications = await Notification.findAll({
        where: { store_id: req.store.id },
        order: [['type', 'ASC'], ['event', 'ASC']],
      });

      res.json(notifications);
    } catch (error: any) {
      console.error('Erro ao listar notificações:', error);
      res.status(500).json({ error: 'Erro ao listar notificações' });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { type, event, enabled, config, webhook_url } = req.body;

      if (!type || !event) {
        res.status(400).json({ error: 'Tipo e evento são obrigatórios' });
        return;
      }

      const notificationConfig = config || {};
      if (webhook_url !== undefined) {
        notificationConfig.webhook_url = webhook_url;
      }

      const [notification, created] = await Notification.findOrCreate({
        where: {
          store_id: req.store.id,
          type,
          event,
        },
        defaults: {
          store_id: req.store.id,
          type,
          event,
          enabled: enabled !== undefined ? enabled : true,
          config: notificationConfig,
        },
      });

      if (!created) {
        await notification.update({
          enabled: enabled !== undefined ? enabled : notification.enabled,
          config: notificationConfig,
        });
      }

      res.json(notification);
    } catch (error: any) {
      console.error('Erro ao atualizar notificação:', error);
      res.status(400).json({ error: error.message || 'Erro ao atualizar notificação' });
    }
  }

  static async testWebhook(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { type, event, webhook_url } = req.body;

      if (!type || !event || !webhook_url) {
        res.status(400).json({ error: 'Tipo, evento e webhook_url são obrigatórios' });
        return;
      }

      // Validar URL do webhook
      try {
        new URL(webhook_url);
      } catch {
        res.status(400).json({ error: 'URL do webhook inválida' });
        return;
      }

      const { WebhookService } = await import('../services/webhookService');
      const success = await WebhookService.sendTestWebhook(webhook_url, `${type} - ${event}`);

      if (success) {
        res.json({ success: true, message: 'Webhook de teste enviado com sucesso!' });
      } else {
        res.status(400).json({ error: 'Falha ao enviar webhook de teste. Verifique a URL.' });
      }
    } catch (error: any) {
      console.error('Erro ao testar webhook:', error);
      res.status(400).json({ error: error.message || 'Erro ao testar webhook' });
    }
  }

  static async bulkUpdate(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { notifications } = req.body;

      if (!Array.isArray(notifications)) {
        res.status(400).json({ error: 'Notificações devem ser um array' });
        return;
      }

      const updates = notifications.map(async (notif: any) => {
        const notificationConfig = notif.config || {};
        if (notif.webhook_url !== undefined) {
          notificationConfig.webhook_url = notif.webhook_url;
        }

        const [notification] = await Notification.findOrCreate({
          where: {
            store_id: req.store!.id,
            type: notif.type,
            event: notif.event,
          },
          defaults: {
            store_id: req.store!.id,
            type: notif.type,
            event: notif.event,
            enabled: notif.enabled !== undefined ? notif.enabled : true,
            config: notificationConfig,
          },
        });

        if (!notification.isNewRecord) {
          await notification.update({
            enabled: notif.enabled !== undefined ? notif.enabled : notification.enabled,
            config: notificationConfig,
          });
        }

        return notification;
      });

      await Promise.all(updates);

      const updatedNotifications = await Notification.findAll({
        where: { store_id: req.store.id },
        order: [['type', 'ASC'], ['event', 'ASC']],
      });

      res.json(updatedNotifications);
    } catch (error: any) {
      console.error('Erro ao atualizar notificações em lote:', error);
      res.status(400).json({ error: error.message || 'Erro ao atualizar notificações' });
    }
  }
}

