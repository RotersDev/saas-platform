import { Response } from 'express';
import { Review, Product } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class ReviewController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { product_id, customer_id } = req.body;

      // Verificar se o produto pertence à loja
      const product = await Product.findOne({
        where: { id: product_id, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const review = await Review.create({
        product_id,
        customer_id,
        ...req.body,
        status: 'pending',
      });

      res.status(201).json(review);
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

      const { status, product_id } = req.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (product_id) {
        where.product_id = product_id;
      }

      const reviews = await Review.findAll({
        where,
        include: [
          {
            association: 'product',
            where: { store_id: req.store.id },
            required: true,
          },
          {
            association: 'customer',
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const review = await Review.findByPk(req.params.id, {
        include: [
          {
            association: 'product',
            where: { store_id: req.store.id },
            required: true,
          },
          {
            association: 'customer',
            required: false,
          },
        ],
      });

      if (!review) {
        res.status(404).json({ error: 'Avaliação não encontrada' });
        return;
      }

      res.json(review);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
  }

  static async approve(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const review = await Review.findByPk(req.params.id, {
        include: [
          {
            association: 'product',
            where: { store_id: req.store.id },
            required: true,
          },
          {
            association: 'customer',
            required: false,
          },
        ],
      });

      if (!review) {
        res.status(404).json({ error: 'Avaliação não encontrada' });
        return;
      }

      await review.update({
        status: 'approved',
        approved_at: new Date(),
      });

      res.json({ message: 'Avaliação aprovada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao aprovar avaliação' });
    }
  }

  static async reject(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const review = await Review.findByPk(req.params.id, {
        include: [
          {
            association: 'product',
            where: { store_id: req.store.id },
            required: true,
          },
          {
            association: 'customer',
            required: false,
          },
        ],
      });

      if (!review) {
        res.status(404).json({ error: 'Avaliação não encontrada' });
        return;
      }

      await review.update({
        status: 'rejected',
        rejected_at: new Date(),
      });

      res.json({ message: 'Avaliação rejeitada' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao rejeitar avaliação' });
    }
  }
}


