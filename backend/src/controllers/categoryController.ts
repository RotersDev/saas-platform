import { Response } from 'express';
import { Category } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class CategoryController {
  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { include_inactive } = req.query;

      const where: any = { store_id: req.store.id };
      if (include_inactive !== 'true') {
        where.is_active = true;
      }

      const categories = await Category.findAll({
        where,
        order: [['name', 'ASC']],
      });

      res.json(categories);
    } catch (error: any) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro ao listar categorias', details: error.message });
    }
  }

  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { name, image_url } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        return;
      }

      // Gerar slug a partir do nome
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Verificar se slug já existe
      const existing = await Category.findOne({
        where: { store_id: req.store.id, slug },
      });

      if (existing) {
        res.status(400).json({ error: 'Categoria com este nome já existe' });
        return;
      }

      const category = await Category.create({
        store_id: req.store.id,
        name,
        slug,
        image_url: image_url || null,
        is_active: true,
      });

      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const category = await Category.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!category) {
        res.status(404).json({ error: 'Categoria não encontrada' });
        return;
      }

      const { name, slug, image_url, is_active } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (is_active !== undefined) updateData.is_active = is_active;

      await category.update(updateData);

      res.json(category);
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

      const category = await Category.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!category) {
        res.status(404).json({ error: 'Categoria não encontrada' });
        return;
      }

      // Verificar se há produtos usando esta categoria
      const { Product } = await import('../models');
      const productsCount = await Product.count({
        where: { category_id: category.id, store_id: req.store.id },
      });

      if (productsCount > 0) {
        res.status(400).json({
          error: `Não é possível excluir a categoria. Existem ${productsCount} produto(s) associado(s).`,
        });
        return;
      }

      await category.destroy();

      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

