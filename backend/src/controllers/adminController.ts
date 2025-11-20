import { Response } from 'express';
import { Store, Plan, Invoice, User, Order, Product } from '../models';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

export class AdminController {
  // Stores
  static async listStores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const stores = await Store.findAndCountAll({
        where,
        include: [{ association: 'plan', required: false }],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      console.log(`[AdminController] Found ${stores.count} stores`);
      res.json(stores);
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
        // Em produção, fazer upload para S3/Cloudinary
        // Por enquanto, salvar localmente
          logoUrl = `/uploads/${(req as any).file.filename}`;
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
}


