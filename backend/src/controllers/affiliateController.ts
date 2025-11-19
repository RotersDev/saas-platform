import { Response } from 'express';
import { Affiliate, Order } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { v4 as uuidv4 } from 'uuid';

export class AffiliateController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const code = req.body.code || uuidv4().substring(0, 8).toUpperCase();

      const affiliate = await Affiliate.create({
        store_id: req.store.id,
        code,
        ...req.body,
      });

      res.status(201).json(affiliate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const affiliates = await Affiliate.findAll({
        where: { store_id: req.store.id },
        order: [['created_at', 'DESC']],
      });

      res.json(affiliates);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar afiliados' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const affiliate = await Affiliate.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!affiliate) {
        res.status(404).json({ error: 'Afiliado não encontrado' });
        return;
      }

      res.json(affiliate);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar afiliado' });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const affiliate = await Affiliate.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!affiliate) {
        res.status(404).json({ error: 'Afiliado não encontrado' });
        return;
      }

      await affiliate.update(req.body);

      res.json(affiliate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getDashboard(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const affiliate = await Affiliate.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!affiliate) {
        res.status(404).json({ error: 'Afiliado não encontrado' });
        return;
      }

      // Buscar pedidos com o código do afiliado
      const orders = await Order.findAll({
        where: {
          store_id: req.store.id,
          affiliate_code: affiliate.code,
          status: 'paid',
        },
      });

      const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const pendingCommission = Number(affiliate.total_commission) - Number(affiliate.paid_commission);

      res.json({
        affiliate,
        stats: {
          clicks: affiliate.clicks,
          leads: affiliate.leads,
          sales: affiliate.sales,
          totalSales,
          totalCommission: affiliate.total_commission,
          paidCommission: affiliate.paid_commission,
          pendingCommission,
        },
        recentOrders: orders.slice(0, 10),
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dashboard' });
    }
  }

  static async payCommission(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { amount } = req.body;

      const affiliate = await Affiliate.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!affiliate) {
        res.status(404).json({ error: 'Afiliado não encontrado' });
        return;
      }

      const pendingCommission = Number(affiliate.total_commission) - Number(affiliate.paid_commission);

      if (amount > pendingCommission) {
        res.status(400).json({ error: 'Valor excede a comissão pendente' });
        return;
      }

      await affiliate.increment('paid_commission', { by: amount });

      res.json({ message: 'Comissão paga com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


