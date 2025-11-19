import { Response } from 'express';
import { PaymentMethod } from '../models';
import { TenantRequest } from '../middleware/tenant';
import logger from '../config/logger';

export class PaymentMethodController {
  /**
   * Lista todos os métodos de pagamento da loja
   */
  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const paymentMethods = await PaymentMethod.findAll({
        where: { store_id: req.store.id },
      });

      // Retornar indicador de que está configurado, mas não o token completo
      const sanitizedMethods = paymentMethods.map((method) => ({
        ...method.toJSON(),
        token: method.token ? '***CONFIGURADO***' : null, // Indicador de que está configurado
        has_token: !!method.token, // Flag para indicar se tem token
      }));

      res.json(sanitizedMethods);
    } catch (error) {
      logger.error('Erro ao listar métodos de pagamento', { error });
      res.status(500).json({ error: 'Erro ao listar métodos de pagamento' });
    }
  }

  /**
   * Obtém um método de pagamento específico
   */
  static async get(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { provider } = req.params;
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: req.store.id,
          provider: provider as 'mercado_pago' | 'pushin_pay',
        },
      });

      if (!paymentMethod) {
        res.status(404).json({ error: 'Método de pagamento não encontrado' });
        return;
      }

      // Retornar indicador de que está configurado, mas não o token completo
      const sanitized = {
        ...paymentMethod.toJSON(),
        token: paymentMethod.token ? '***CONFIGURADO***' : null, // Indicador de que está configurado
        has_token: !!paymentMethod.token, // Flag para indicar se tem token
      };

      res.json(sanitized);
    } catch (error) {
      logger.error('Erro ao buscar método de pagamento', { error });
      res.status(500).json({ error: 'Erro ao buscar método de pagamento' });
    }
  }

  /**
   * Cria ou atualiza um método de pagamento
   */
  static async upsert(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { provider, token, enabled, sandbox, config } = req.body;

      if (!provider || !['mercado_pago', 'pushin_pay'].includes(provider)) {
        res.status(400).json({ error: 'Provider inválido' });
        return;
      }

      // Validar token obrigatório para Pushin Pay
      if (provider === 'pushin_pay' && !token) {
        res.status(400).json({ error: 'Token é obrigatório para Pushin Pay' });
        return;
      }

      // Buscar método existente
      let paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: req.store.id,
          provider: provider as 'mercado_pago' | 'pushin_pay',
        },
      });

      // Account ID da plataforma (configurado no backend)
      // Para Pushin Pay, usar o account_id da plataforma para receber o split
      const platformAccountId = process.env.PUSHIN_PAY_ACCOUNT_ID || null;

      if (paymentMethod) {
        // Atualizar - só atualizar token se foi fornecido um novo
        const updateData: any = {
          account_id: platformAccountId || paymentMethod.account_id, // Usar account_id da plataforma
          enabled: enabled !== undefined ? enabled : paymentMethod.enabled,
          sandbox: sandbox !== undefined ? sandbox : paymentMethod.sandbox,
          config: config || paymentMethod.config,
        };

        // Só atualizar token se foi fornecido um novo
        if (token && token.trim()) {
          updateData.token = token;
        }

        await paymentMethod.update(updateData);
      } else {
        // Criar novo - usar account_id da plataforma
        paymentMethod = await PaymentMethod.create({
          store_id: req.store.id,
          provider: provider as 'mercado_pago' | 'pushin_pay',
          token: token || null,
          account_id: platformAccountId, // Account ID da plataforma para receber split
          enabled: enabled !== undefined ? enabled : false,
          sandbox: sandbox !== undefined ? sandbox : false,
          config: config || {},
        });
      }

      // Retornar indicador de que está configurado, mas não o token completo
      const sanitized = {
        ...paymentMethod.toJSON(),
        token: paymentMethod.token ? '***CONFIGURADO***' : null, // Indicador de que está configurado
        has_token: !!paymentMethod.token, // Flag para indicar se tem token
      };

      res.json(sanitized);
    } catch (error: any) {
      logger.error('Erro ao salvar método de pagamento', { error });
      res.status(500).json({ error: error.message || 'Erro ao salvar método de pagamento' });
    }
  }

  /**
   * Remove um método de pagamento
   */
  static async remove(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { provider } = req.params;
      const paymentMethod = await PaymentMethod.findOne({
        where: {
          store_id: req.store.id,
          provider: provider as 'mercado_pago' | 'pushin_pay',
        },
      });

      if (!paymentMethod) {
        res.status(404).json({ error: 'Método de pagamento não encontrado' });
        return;
      }

      await paymentMethod.destroy();

      res.status(204).send();
    } catch (error) {
      logger.error('Erro ao remover método de pagamento', { error });
      res.status(500).json({ error: 'Erro ao remover método de pagamento' });
    }
  }
}

