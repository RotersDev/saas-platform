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
        order: [['display_order', 'ASC'], ['created_at', 'ASC']],
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
      let finalImageUrl = image_url || null;

      if (!name) {
        res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        return;
      }

      // Processar upload de imagem - usando Cloudflare R2
      const file = (req as any).file;
      if (file) {
        try {
          const { uploadToR2 } = await import('../services/r2Service');
          const uploadedUrl = await uploadToR2({
            storeId: req.store.id,
            category: 'categories',
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
          });
          const { cleanR2Url } = await import('../services/r2Service');
          finalImageUrl = cleanR2Url(uploadedUrl);
        } catch (error: any) {
          console.error('[CategoryController] Erro ao fazer upload da imagem para R2:', error);
          res.status(500).json({ error: 'Erro ao fazer upload da imagem', details: error.message });
          return;
        }
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

      // Buscar o maior display_order atual para definir a ordem da nova categoria
      const maxOrder = await Category.max('display_order', {
        where: { store_id: req.store.id },
      }) || 0;

      const category = await Category.create({
        store_id: req.store.id,
        name,
        slug,
        image_url: finalImageUrl,
        is_active: true,
        display_order: Number(maxOrder) + 1,
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

      // Processar upload de imagem - usando Cloudflare R2
      const file = (req as any).file;
      if (file) {
        try {
          const { uploadToR2, cleanR2Url } = await import('../services/r2Service');
          const uploadedUrl = await uploadToR2({
            storeId: req.store.id,
            category: 'categories',
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
          });
          updateData.image_url = cleanR2Url(uploadedUrl);
        } catch (error: any) {
          console.error('[CategoryController] Erro ao fazer upload da imagem para R2:', error);
          res.status(500).json({ error: 'Erro ao fazer upload da imagem', details: error.message });
          return;
        }
      } else if (image_url !== undefined) {
        // Se não há arquivo novo mas há URL, usar a URL (ou remover se vazia)
        if (image_url === '' || image_url === null) {
          updateData.image_url = null;
        } else {
          updateData.image_url = image_url;
        }
      }

      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
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

  static async updateOrder(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds)) {
        res.status(400).json({ error: 'categoryIds deve ser um array' });
        return;
      }

      // Converter todos os IDs para números
      const numericIds = categoryIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));

      if (numericIds.length !== categoryIds.length) {
        res.status(400).json({ error: 'IDs de categorias inválidos' });
        return;
      }

      // Verificar se todas as categorias pertencem à loja
      const { Op } = await import('sequelize');
      const categories = await Category.findAll({
        where: {
          id: { [Op.in]: numericIds },
          store_id: req.store.id,
        },
      });

      if (categories.length !== numericIds.length) {
        console.error('[CategoryController] Categorias encontradas:', categories.length, 'IDs enviados:', numericIds.length);
        console.error('[CategoryController] IDs enviados:', numericIds);
        console.error('[CategoryController] IDs encontrados:', categories.map(c => c.id));
        res.status(400).json({
          error: 'Uma ou mais categorias não foram encontradas',
          details: {
            sent: numericIds.length,
            found: categories.length,
            sentIds: numericIds,
            foundIds: categories.map(c => c.id)
          }
        });
        return;
      }

      // Atualizar display_order de cada categoria
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      await Promise.all(
        numericIds.map((categoryId: number, index: number) => {
          return Category.update(
            { display_order: index + 1 },
            { where: { id: categoryId, store_id: req.store!.id } }
          );
        })
      );

      res.json({ message: 'Ordem das categorias atualizada com sucesso' });
    } catch (error: any) {
      console.error('[CategoryController] Erro ao atualizar ordem:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar ordem das categorias' });
    }
  }
}

