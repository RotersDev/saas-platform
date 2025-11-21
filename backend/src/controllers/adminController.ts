import { Response } from 'express';
import { Store, Plan, Invoice, User, Order, Product, Wallet, Withdrawal, OrderItem, Payment, ProductKey, Category, Customer, Theme } from '../models';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import emailService from '../services/emailService';
import sequelize from '../config/database';

export class AdminController {
  // Stores
  static async listStores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 20, search } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      // Busca por nome, subdomain, email
      if (search) {
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          { name: { [Op.iLike]: searchTerm } },
          { subdomain: { [Op.iLike]: searchTerm } },
          { email: { [Op.iLike]: searchTerm } },
        ];
      }

      const stores = await Store.findAndCountAll({
        where,
        include: [{ association: 'plan', required: false }],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      // Buscar estatísticas de cada loja (faturamento e lucro do admin)
      const storesWithStats = await Promise.all(
        stores.rows.map(async (store) => {
          // Buscar pedidos pagos/entregues da loja
          const orders = await Order.findAll({
            where: {
              store_id: store.id,
              [Op.or]: [
                { status: 'paid' },
                { status: 'delivered' },
                { payment_status: 'paid' },
              ],
            },
          });

          // Calcular faturamento total
          const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

          // Buscar configuração de split para calcular lucro do admin
          const { SplitConfig } = await import('../models');
          const splitConfig = await SplitConfig.findOne({
            where: { store_id: store.id },
          });

          // Calcular lucro do admin
          // 1. Taxa de gateway: R$ 0.70 por transação
          const gatewayFee = orders.length * 0.70;

          // 2. Taxa da plataforma: usar split configurado ou padrão de 3%
          let platformFee = 0;
          if (splitConfig && splitConfig.split_1_percentage) {
            const platformPercentage = Number(splitConfig.split_1_percentage) / 100;
            platformFee = totalRevenue * platformPercentage;
          } else {
            // Padrão: 3% do valor total
            platformFee = totalRevenue * 0.03;
          }

          // Lucro total = Taxa de gateway + Taxa da plataforma
          const totalAdminProfit = gatewayFee + platformFee;

          return {
            ...store.toJSON(),
            stats: {
              totalRevenue,
              adminProfit: totalAdminProfit,
              totalOrders: orders.length,
            },
          };
        })
      );

      console.log(`[AdminController] Found ${stores.count} stores`);
      res.json({
        rows: storesWithStats,
        count: stores.count,
      });
    } catch (error: any) {
      console.error('[AdminController] Error listing stores:', error);
      res.status(500).json({ error: 'Erro ao listar lojas', details: error.message });
    }
  }

  static async createStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, subdomain, email, password, plan_id } = req.body;

      // Verificar se subdomain já existe
      const existingStore = await Store.findOne({ where: { subdomain } });
      if (existingStore) {
        res.status(400).json({ error: 'Subdomínio já existe' });
        return;
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }

      // Processar banner se houver
      let logoUrl: string | undefined = undefined;
      if ((req as any).file) {
        // Fazer upload para Cloudflare R2
        const { uploadToR2 } = await import('../services/r2Service');
        const storeId = Number(req.body.store_id || req.params.id || 0);
        logoUrl = await uploadToR2({
          storeId: storeId || 0,
          category: 'banners',
          buffer: (req as any).file.buffer,
          mimeType: (req as any).file.mimetype,
          originalName: (req as any).file.originalname,
        });
      }

      // Criar loja
      const store = await Store.create({
        name,
        subdomain,
        email,
        plan_id: plan_id || 1,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        logo_url: logoUrl,
        is_white_label: false,
        settings: {},
      });

      // Criar usuário admin da loja
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        store_id: store.id,
        name: name,
        email,
        password: hashedPassword,
        role: 'store_admin',
        is_active: true,
      });

      // Criar tema padrão
      const { Theme } = await import('../models');
      await Theme.create({
        store_id: store.id,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#007bff',
        homepage_components: {},
      });

      res.status(201).json(store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id, {
        include: [
          { association: 'plan' },
          { association: 'users' },
        ],
      });

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      // Buscar estatísticas da loja
      const totalOrders = await Order.count({ where: { store_id: store.id } });
      const paidOrders = await Order.count({
        where: { store_id: store.id, status: 'paid' }
      });

      const totalRevenue = await Order.sum('total', {
        where: { store_id: store.id, status: 'paid' },
      }) || 0;

      const totalProducts = await Product.count({
        where: { store_id: store.id },
      });

      const invoices = await Invoice.findAll({
        where: { store_id: store.id },
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      const storeData = store.toJSON();
      (storeData as any).stats = {
        totalOrders,
        paidOrders,
        totalRevenue,
        totalProducts,
        recentInvoices: invoices,
      };

      res.json(storeData);
    } catch (error: any) {
      console.error('[AdminController] Error getting store:', error);
      res.status(500).json({ error: 'Erro ao buscar loja', details: error.message });
    }
  }

  static async updateStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id);

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await store.update(req.body);

      res.json(store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async suspendStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id);

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await store.update({ status: 'suspended' });

      res.json({ message: 'Loja suspensa com sucesso', store });
    } catch (error: any) {
      console.error('[AdminController] Error suspending store:', error);
      res.status(500).json({ error: 'Erro ao suspender loja', details: error.message });
    }
  }

  static async blockStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id);

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await store.update({ status: 'blocked' });

      res.json({ message: 'Loja bloqueada com sucesso', store });
    } catch (error: any) {
      console.error('[AdminController] Error blocking store:', error);
      res.status(500).json({ error: 'Erro ao bloquear loja', details: error.message });
    }
  }

  static async activateStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id);

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await store.update({ status: 'active' });

      res.json({ message: 'Loja ativada com sucesso', store });
    } catch (error: any) {
      console.error('[AdminController] Error activating store:', error);
      res.status(500).json({ error: 'Erro ao ativar loja', details: error.message });
    }
  }

  static async deleteStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const store = await Store.findByPk(req.params.id);

      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await store.destroy();

      res.json({ message: 'Loja excluída com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir loja' });
    }
  }

  // Plans
  static async listPlans(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const plans = await Plan.findAll({
        order: [['price', 'ASC']],
      });

      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar planos' });
    }
  }

  static async createPlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const plan = await Plan.create(req.body);

      res.status(201).json(plan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updatePlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const plan = await Plan.findByPk(req.params.id);

      if (!plan) {
        res.status(404).json({ error: 'Plano não encontrado' });
        return;
      }

      await plan.update(req.body);

      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deletePlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const plan = await Plan.findByPk(req.params.id);

      if (!plan) {
        res.status(404).json({ error: 'Plano não encontrado' });
        return;
      }

      await plan.destroy();

      res.json({ message: 'Plano excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir plano' });
    }
  }

  // Stats
  static async getStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const totalStores = await Store.count();
      const activeStores = await Store.count({ where: { status: 'active' } });
      const totalOrders = await Order.count();
      const totalRevenue = await Order.sum('total', {
        where: { status: 'paid' },
      });

      const storesExpiring = await Store.count({
        where: {
          trial_ends_at: {
            [Op.lte]: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          },
          status: 'trial',
        },
      });

      res.json({
        totalStores,
        activeStores,
        totalOrders,
        totalRevenue: totalRevenue || 0,
        storesExpiring,
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  // Invoices
  static async listInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const invoices = await Invoice.findAndCountAll({
        where,
        include: [{ association: 'store' }, { association: 'plan' }],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar faturas' });
    }
  }

  // Saques
  static async listWithdrawals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 50 } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const withdrawals = await Withdrawal.findAndCountAll({
        where,
        include: [
          {
            model: Wallet,
            as: 'wallet',
            include: [
              {
                model: Store,
                as: 'store',
                attributes: ['id', 'name', 'subdomain', 'email'],
              },
            ],
          },
        ],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      // Buscar também novos cadastros de dados pessoais (wallets criados recentemente com dados pessoais)
      const recentPersonalDataRegistrations = await Wallet.findAll({
        where: {
          full_name: { [Op.ne]: null as any },
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
        },
        include: [
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name', 'subdomain', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 50,
      });

      res.json({
        withdrawals: withdrawals.rows.map((w) => ({
          id: w.id.toString().padStart(8, '0'),
          amount: parseFloat(w.amount.toString()),
          pix_key: w.pix_key,
          status: w.status,
          created_at: w.created_at,
          store: (w as any).wallet?.store,
          wallet: {
            full_name: (w as any).wallet?.full_name,
            cpf: (w as any).wallet?.cpf,
            email: (w as any).wallet?.email,
          },
        })),
        count: withdrawals.count,
        personalDataRegistrations: recentPersonalDataRegistrations.map((w) => ({
          id: w.id,
          store: (w as any).store,
          full_name: w.full_name,
          cpf: w.cpf,
          email: w.email,
          birth_date: w.birth_date,
          created_at: w.created_at,
        })),
      });
    } catch (error: any) {
      console.error('[AdminController] Error listing withdrawals:', error);
      res.status(500).json({ error: 'Erro ao listar saques', details: error.message });
    }
  }

  static async approveWithdrawal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const withdrawal = await Withdrawal.findByPk(Number(id), {
        include: [
          {
            model: Wallet,
            as: 'wallet',
            include: [
              {
                model: Store,
                as: 'store',
              },
            ],
          },
        ],
      });

      if (!withdrawal) {
        res.status(404).json({ error: 'Saque não encontrado' });
        return;
      }

      if (withdrawal.status !== 'pending') {
        res.status(400).json({ error: 'Saque já foi processado' });
        return;
      }

      const wallet = (withdrawal as any).wallet;
      const withdrawalAmount = parseFloat(withdrawal.amount.toString());

      // Atualizar status para approved
      await withdrawal.update({
        status: 'approved',
        processed_at: new Date(),
      });

      // Remover valor do saldo retido (foi pago)
      const currentRetainedBalance = parseFloat(wallet.retained_balance.toString());
      await wallet.update({
        retained_balance: Math.max(0, currentRetainedBalance - withdrawalAmount),
      });

      // Enviar email
      if (wallet?.email && wallet?.full_name) {
        await emailService.sendWithdrawalApproved(
          wallet.email,
          wallet.full_name,
          withdrawalAmount,
          withdrawal.id.toString().padStart(8, '0')
        );
      }

      res.json({ message: 'Saque aprovado com sucesso' });
    } catch (error: any) {
      console.error('[AdminController] Error approving withdrawal:', error);
      res.status(500).json({ error: 'Erro ao aprovar saque', details: error.message });
    }
  }

  static async rejectWithdrawal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({ error: 'Motivo do cancelamento é obrigatório' });
        return;
      }

      const withdrawal = await Withdrawal.findByPk(Number(id), {
        include: [
          {
            model: Wallet,
            as: 'wallet',
            include: [
              {
                model: Store,
                as: 'store',
              },
            ],
          },
        ],
      });

      if (!withdrawal) {
        res.status(404).json({ error: 'Saque não encontrado' });
        return;
      }

      if (withdrawal.status !== 'pending') {
        res.status(400).json({ error: 'Saque já foi processado' });
        return;
      }

      const wallet = (withdrawal as any).wallet;
      const withdrawalAmount = parseFloat(withdrawal.amount.toString());

      // Atualizar status e devolver saldo
      await withdrawal.update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        processed_at: new Date(),
      });

      // Devolver saldo: remover do retido e voltar para disponível
      const currentRetainedBalance = parseFloat(wallet.retained_balance.toString());
      const currentAvailableBalance = parseFloat(wallet.available_balance.toString());
      await wallet.update({
        retained_balance: Math.max(0, currentRetainedBalance - withdrawalAmount),
        available_balance: currentAvailableBalance + withdrawalAmount,
      });

      // Enviar email
      if (wallet?.email && wallet?.full_name) {
        await emailService.sendWithdrawalRejected(
          wallet.email,
          wallet.full_name,
          withdrawalAmount,
          withdrawal.id.toString().padStart(8, '0'),
          reason.trim()
        );
      }

      res.json({ message: 'Saque cancelado com sucesso' });
    } catch (error: any) {
      console.error('[AdminController] Error rejecting withdrawal:', error);
      res.status(500).json({ error: 'Erro ao cancelar saque', details: error.message });
    }
  }

  // Vendas
  static async listSales(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search, date, page = 1, limit = 100 } = req.query;

      // Construir filtros de data
      const dateFilter: any = {};
      if (date === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFilter.created_at = { [Op.gte]: today };
      } else if (date === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter.created_at = { [Op.gte]: weekAgo };
      } else if (date === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter.created_at = { [Op.gte]: monthAgo };
      }

      // Construir filtros de busca
      const where: any = {
        ...dateFilter,
        [Op.or]: [
          { status: 'paid' },
          { status: 'delivered' },
          { payment_status: 'paid' },
        ],
      };

      // Busca por loja, pedido, email ou produto
      if (search) {
        const searchTerm = `%${search}%`;

        // Buscar lojas que correspondem à busca
        const storesBySearch = await Store.findAll({
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: searchTerm } },
              { subdomain: { [Op.iLike]: searchTerm } },
            ],
          },
          attributes: ['id'],
        });
        const storeIds = storesBySearch.map((s: any) => s.id);

        // Buscar pedidos por número ou email
        const ordersBySearch = await Order.findAll({
          where: {
            [Op.or]: [
              { order_number: { [Op.iLike]: searchTerm } },
              { customer_email: { [Op.iLike]: searchTerm } },
            ],
          },
          attributes: ['id'],
        });

        // Buscar pedidos por nome do produto
        const itemsByProduct = await OrderItem.findAll({
          where: {
            product_name: { [Op.iLike]: searchTerm },
          },
          attributes: ['order_id'],
        });

        const orderIds = [
          ...ordersBySearch.map((o: any) => o.id),
          ...itemsByProduct.map((i: any) => i.order_id),
        ];

        const searchConditions: any[] = [];

        if (storeIds.length > 0) {
          searchConditions.push({ store_id: { [Op.in]: storeIds } });
        }

        if (orderIds.length > 0) {
          searchConditions.push({ id: { [Op.in]: [...new Set(orderIds)] } });
        }

        if (searchConditions.length > 0) {
          where[Op.and] = [
            ...(where[Op.and] || []),
            { [Op.or]: searchConditions },
          ];
        } else {
          // Nenhum resultado encontrado
          res.json({ sales: [], count: 0 });
          return;
        }
      }

      const orders = await Order.findAndCountAll({
        where,
        include: [
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name', 'subdomain', 'email'],
          },
          {
            model: OrderItem,
            as: 'items',
            attributes: ['id', 'product_name', 'quantity', 'price', 'total'],
          },
          {
            model: Payment,
            as: 'payment',
            required: false,
            attributes: ['pushin_pay_id', 'mercado_pago_id'],
          },
        ],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      res.json({
        sales: orders.rows.map((order) => ({
          id: order.id,
          order_number: order.order_number,
          total: parseFloat(order.total.toString()),
          created_at: order.created_at,
          store: (order as any).store,
          items: (order as any).items || [],
          payment: (order as any).payment || null,
        })),
        count: orders.count,
      });
    } catch (error: any) {
      console.error('[AdminController] Error listing sales:', error);
      res.status(500).json({ error: 'Erro ao listar vendas', details: error.message });
    }
  }

  // Accounts
  static async listAccounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search } = req.query;

      const where: any = {};

      // Busca por email, nome ou username
      if (search) {
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          { email: { [Op.iLike]: searchTerm } },
          { name: { [Op.iLike]: searchTerm } },
          { username: { [Op.iLike]: searchTerm } },
        ];
      }

      const users = await User.findAll({
        where,
        include: [
          {
            model: Store,
            as: 'store',
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(
        users.map((user: any) => ({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          store_id: user.store_id,
          store: user.store
            ? {
                id: user.store.id,
                name: user.store.name,
                subdomain: user.store.subdomain,
              }
            : null,
          created_at: user.created_at,
        }))
      );
    } catch (error: any) {
      console.error('[AdminController] Error listing accounts:', error);
      res.status(500).json({ error: 'Erro ao listar contas', details: error.message });
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const userId = Number(id);

      if (!userId || isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuário inválido' });
        return;
      }

      // Buscar usuário
      const user = await User.findByPk(userId, {
        include: [{ association: 'store', required: false }],
        transaction,
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        await transaction.rollback();
        return;
      }

      const storeId = user.store_id;

      if (storeId) {
        // Deletar tudo relacionado à loja
        // 1. Deletar ProductKeys
        await ProductKey.destroy({
          where: {
            product_id: {
              [Op.in]: sequelize.literal(`(SELECT id FROM products WHERE store_id = ${storeId})`),
            },
          },
          transaction,
        });

        // 2. Deletar OrderItems
        await OrderItem.destroy({
          where: {
            order_id: {
              [Op.in]: sequelize.literal(`(SELECT id FROM orders WHERE store_id = ${storeId})`),
            },
          },
          transaction,
        });

        // 3. Deletar Payments
        await Payment.destroy({
          where: {
            order_id: {
              [Op.in]: sequelize.literal(`(SELECT id FROM orders WHERE store_id = ${storeId})`),
            },
          },
          transaction,
        });

        // 4. Deletar Orders
        await Order.destroy({
          where: { store_id: storeId },
          transaction,
        });

        // 5. Deletar Customers
        await Customer.destroy({
          where: { store_id: storeId },
          transaction,
        });

        // 6. Deletar Products
        await Product.destroy({
          where: { store_id: storeId },
          transaction,
        });

        // 7. Deletar Categories
        await Category.destroy({
          where: { store_id: storeId },
          transaction,
        });

        // 8. Deletar Withdrawals
        const wallet = await Wallet.findOne({
          where: { store_id: storeId },
          transaction,
        });

        if (wallet) {
          await Withdrawal.destroy({
            where: { wallet_id: wallet.id },
            transaction,
          });

          // 9. Deletar Wallet
          await Wallet.destroy({
            where: { store_id: storeId },
            transaction,
          });
        }

        // 10. Deletar Theme
        await Theme.destroy({
          where: { store_id: storeId },
          transaction,
        });

        // 11. Deletar Store
        await Store.destroy({
          where: { id: storeId },
          transaction,
        });
      }

      // 12. Deletar User
      await User.destroy({
        where: { id: userId },
        transaction,
      });

      await transaction.commit();

      res.json({ message: 'Conta e todos os dados relacionados foram deletados com sucesso' });
    } catch (error: any) {
      await transaction.rollback();
      console.error('[AdminController] Error deleting account:', error);
      res.status(500).json({ error: 'Erro ao deletar conta', details: error.message });
    }
  }
}


