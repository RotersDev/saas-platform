import { Response } from 'express';
import { Wallet, Withdrawal } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { Op } from 'sequelize';

const MIN_WITHDRAWAL = 5.00;
const MAX_WITHDRAWAL = 50000.00;
const MAX_WITHDRAWALS_PER_DAY = 10;

export class WalletController {
  // Buscar dados da carteira
  static async getWallet(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      let wallet = await Wallet.findOne({
        where: { store_id: req.store.id },
      });

      // Criar carteira se não existir
      if (!wallet) {
        wallet = await Wallet.create({
          store_id: req.store.id,
          available_balance: 0,
          retained_balance: 0,
        });
      }

      const walletData = wallet.toJSON();
      const hasPersonalData = !!(wallet.full_name && wallet.cpf && wallet.birth_date && wallet.email);

      res.json({
        ...walletData,
        has_personal_data: hasPersonalData,
        personal_data: hasPersonalData ? {
          full_name: wallet.full_name,
          cpf: wallet.cpf,
          birth_date: wallet.birth_date,
          email: wallet.email,
        } : undefined,
      });
    } catch (error: any) {
      console.error('Erro ao buscar carteira:', error);
      res.status(500).json({ error: 'Erro ao buscar carteira' });
    }
  }

  // Salvar dados pessoais
  static async savePersonalData(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { full_name, cpf, birth_date, email } = req.body;

      if (!full_name || !cpf || !birth_date || !email) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        return;
      }

      // Validar CPF (formato básico)
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        res.status(400).json({ error: 'CPF inválido' });
        return;
      }

      let wallet = await Wallet.findOne({
        where: { store_id: req.store.id },
      });

      if (!wallet) {
        wallet = await Wallet.create({
          store_id: req.store.id,
          available_balance: 0,
          retained_balance: 0,
        });
      }

      await wallet.update({
        full_name,
        cpf: cleanCpf,
        birth_date: new Date(birth_date),
        email,
      });

      res.json({ message: 'Dados pessoais salvos com sucesso' });
    } catch (error: any) {
      console.error('Erro ao salvar dados pessoais:', error);
      res.status(500).json({ error: 'Erro ao salvar dados pessoais' });
    }
  }

  // Criar saque
  static async createWithdrawal(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { amount, pix_key } = req.body;

      if (!amount || !pix_key) {
        res.status(400).json({ error: 'Valor e chave PIX são obrigatórios' });
        return;
      }

      const withdrawalAmount = parseFloat(amount);

      if (isNaN(withdrawalAmount) || withdrawalAmount < MIN_WITHDRAWAL) {
        res.status(400).json({ error: `O valor mínimo para saque é R$ ${MIN_WITHDRAWAL.toFixed(2)}` });
        return;
      }

      if (withdrawalAmount > MAX_WITHDRAWAL) {
        res.status(400).json({ error: `O valor máximo para saque é R$ ${MAX_WITHDRAWAL.toFixed(2)}` });
        return;
      }

      let wallet = await Wallet.findOne({
        where: { store_id: req.store.id },
      });

      if (!wallet) {
        res.status(404).json({ error: 'Carteira não encontrada' });
        return;
      }

      // Verificar se tem dados pessoais
      if (!wallet.full_name || !wallet.cpf || !wallet.birth_date || !wallet.email) {
        res.status(400).json({ error: 'É necessário cadastrar dados pessoais antes de realizar saques' });
        return;
      }

      // Verificar saldo disponível
      const availableBalance = parseFloat(wallet.available_balance.toString());
      if (withdrawalAmount > availableBalance) {
        res.status(400).json({ error: 'Saldo insuficiente' });
        return;
      }

      // Verificar limite de saques por dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const withdrawalsToday = await Withdrawal.count({
        where: {
          wallet_id: wallet.id,
          created_at: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
        },
      });

      if (withdrawalsToday >= MAX_WITHDRAWALS_PER_DAY) {
        res.status(400).json({ error: `Limite de ${MAX_WITHDRAWALS_PER_DAY} saques por dia atingido` });
        return;
      }

      // Criar saque
      const withdrawal = await Withdrawal.create({
        wallet_id: wallet.id,
        store_id: req.store.id,
        amount: withdrawalAmount,
        pix_key: pix_key.trim(),
        status: 'pending',
      });

      // Atualizar saldo (mover para retido)
      const currentRetainedBalance = parseFloat(wallet.retained_balance.toString());
      await wallet.update({
        available_balance: availableBalance - withdrawalAmount,
        retained_balance: currentRetainedBalance + withdrawalAmount,
        pix_key: pix_key.trim(), // Salvar chave PIX
      });

      res.json({
        id: withdrawal.id.toString().padStart(8, '0'),
        amount: withdrawal.amount,
        status: withdrawal.status,
        created_at: withdrawal.created_at,
      });
    } catch (error: any) {
      console.error('Erro ao criar saque:', error);
      res.status(500).json({ error: 'Erro ao criar saque' });
    }
  }

  // Listar saques
  static async getWithdrawals(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const wallet = await Wallet.findOne({
        where: { store_id: req.store.id },
      });

      if (!wallet) {
        res.json([]);
        return;
      }

      const withdrawals = await Withdrawal.findAll({
        where: { wallet_id: wallet.id },
        order: [['created_at', 'DESC']],
      });

      res.json(
        withdrawals.map((w) => ({
          id: w.id.toString().padStart(8, '0'),
          amount: parseFloat(w.amount.toString()),
          status: w.status,
          created_at: w.created_at,
          rejection_reason: w.rejection_reason || null,
          processed_at: w.processed_at || null,
        }))
      );
    } catch (error: any) {
      console.error('Erro ao buscar saques:', error);
      res.status(500).json({ error: 'Erro ao buscar saques' });
    }
  }

  // Listar transações (vendas que creditaram na carteira)
  static async getTransactions(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { Payment, Order } = await import('../models');

      // Buscar todos os pagamentos aprovados desta loja que creditaram na carteira
      const payments = await Payment.findAll({
        where: {
          status: 'approved',
        },
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              store_id: req.store.id,
            },
            required: true,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 100, // Limitar a 100 transações mais recentes
      });

      // Filtrar apenas pagamentos que têm transação registrada
      const transactions = payments
        .filter((p: any) => p.metadata?.wallet_credited === true && p.metadata?.transaction)
        .map((p: any) => ({
          id: p.id,
          type: 'credit',
          amount: p.metadata.transaction.amount || 0,
          previous_balance: p.metadata.transaction.previous_balance || 0,
          new_balance: p.metadata.transaction.new_balance || 0,
          order_id: p.metadata.transaction.order_id,
          order_number: p.metadata.transaction.order_number,
          created_at: p.metadata.credited_at || p.created_at,
          description: `Venda - Pedido #${p.metadata.transaction.order_number || p.metadata.transaction.order_id}`,
        }));

      res.json(transactions);
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  }
}

