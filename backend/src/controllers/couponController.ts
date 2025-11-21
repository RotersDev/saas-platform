import { Response } from 'express';
import { Coupon } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class CouponController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const coupon = await Coupon.create({
        store_id: req.store.id,
        ...req.body,
      });

      res.status(201).json(coupon);
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

      const coupons = await Coupon.findAll({
        where: { store_id: req.store.id },
        order: [['created_at', 'DESC']],
      });

      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar cupons' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const coupon = await Coupon.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!coupon) {
        res.status(404).json({ error: 'Cupom não encontrado' });
        return;
      }

      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cupom' });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const coupon = await Coupon.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!coupon) {
        res.status(404).json({ error: 'Cupom não encontrado' });
        return;
      }

      await coupon.update(req.body);

      res.json(coupon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const coupon = await Coupon.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!coupon) {
        res.status(404).json({ error: 'Cupom não encontrado' });
        return;
      }

      await coupon.destroy();

      res.json({ message: 'Cupom excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir cupom' });
    }
  }

  static async validate(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { code, amount } = req.body;

      const coupon = await Coupon.findOne({
        where: {
          code,
          store_id: req.store.id,
          is_active: true,
        },
      });

      if (!coupon) {
        res.status(404).json({ error: 'Cupom inválido' });
        return;
      }

      const now = new Date();
      if (now < coupon.valid_from || now > coupon.valid_until) {
        res.status(400).json({ error: 'Cupom fora do período de validade' });
        return;
      }

      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        res.status(400).json({ error: 'Cupom esgotado' });
        return;
      }

      if (coupon.min_purchase && amount < Number(coupon.min_purchase)) {
        res.status(400).json({
          error: `Valor mínimo de compra: R$ ${coupon.min_purchase}`,
        });
        return;
      }

      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = (amount * Number(coupon.value)) / 100;
        if (coupon.max_discount && discount > Number(coupon.max_discount)) {
          discount = Number(coupon.max_discount);
        }
      } else {
        discount = Number(coupon.value);
      }

      res.json({
        valid: true,
        discount,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          max_discount: coupon.max_discount,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao validar cupom' });
    }
  }
}


