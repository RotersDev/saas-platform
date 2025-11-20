import { Response } from 'express';
import { Product, ProductKey } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { Op } from 'sequelize';

export class ProductController {
  static async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      // Validar categoria
      if (req.body.category_id) {
        const { Category } = await import('../models');
        const category = await Category.findOne({
          where: { id: req.body.category_id, store_id: req.store.id },
        });
        if (!category) {
          res.status(400).json({ error: 'Categoria não encontrada' });
          return;
        }
      }

      // Processar imagens enviadas
      let images: string[] = [];

      // Processar arquivos enviados
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Usar URL relativa para funcionar com proxy do Vite
        const uploadedImages = req.files.map((file: Express.Multer.File) =>
          `/uploads/${file.filename}`
        );
        images = uploadedImages;

        // Se também há imagens por URL no body, combinar
        if (req.body.images && typeof req.body.images === 'string') {
          try {
            const urlImages = JSON.parse(req.body.images);
            if (Array.isArray(urlImages)) {
              images = [...uploadedImages, ...urlImages];
            }
          } catch (e) {
            // Ignorar erro de parse
          }
        }
      } else if (req.body.images) {
        // Se imagens vieram apenas como JSON (URLs)
        if (typeof req.body.images === 'string') {
          try {
            images = JSON.parse(req.body.images);
          } catch (e) {
            images = [];
          }
        } else if (Array.isArray(req.body.images)) {
          images = req.body.images;
        }
      }

      const productData: any = {
        ...req.body,
        images,
      };

      // Converter campos numéricos vazios para null ou valores padrão
      if (productData.category_id === '' || productData.category_id === null) {
        delete productData.category_id;
      } else if (productData.category_id) {
        productData.category_id = parseInt(productData.category_id);
      }

      if (productData.price === '' || productData.price === null) {
        delete productData.price;
      } else if (productData.price) {
        productData.price = parseFloat(productData.price);
      }

      if (productData.promotional_price === '' || productData.promotional_price === null) {
        productData.promotional_price = null;
      } else if (productData.promotional_price) {
        productData.promotional_price = parseFloat(productData.promotional_price);
      }

      if (productData.stock_limit === '' || productData.stock_limit === null) {
        productData.stock_limit = null;
      } else if (productData.stock_limit) {
        productData.stock_limit = parseInt(productData.stock_limit);
      }

      if (productData.min_quantity === '' || productData.min_quantity === null) {
        productData.min_quantity = null;
      } else if (productData.min_quantity) {
        productData.min_quantity = parseInt(productData.min_quantity);
      }

      if (productData.max_quantity === '' || productData.max_quantity === null) {
        productData.max_quantity = null;
      } else if (productData.max_quantity) {
        productData.max_quantity = parseInt(productData.max_quantity);
      }

      // Parse de arrays se vieram como strings
      if (typeof productData.benefits === 'string') {
        try {
          productData.benefits = JSON.parse(productData.benefits);
        } catch (e) {
          productData.benefits = [];
        }
      }
      if (typeof productData.tags === 'string') {
        try {
          productData.tags = JSON.parse(productData.tags);
        } catch (e) {
          productData.tags = [];
        }
      }

      const product = await Product.create({
        store_id: req.store.id,
        ...productData,
      });

      res.status(201).json(product);
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

      const { page = 1, limit = 20, search, category, featured } = req.query;

      const where: any = { store_id: req.store.id };

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (category) {
        // Buscar categoria por nome e usar category_id
        const { Category } = await import('../models');
        const categoryObj = await Category.findOne({
          where: { name: String(category), store_id: req.store.id },
        });
        if (categoryObj) {
          where.category_id = categoryObj.id;
        }
      }

      if (featured !== undefined) {
        where.featured = featured === 'true';
      }

      const products = await Product.findAndCountAll({
        where,
        include: [{ association: 'categoryData', required: false }],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      });

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const product = await Product.findOne({
        where: { id: req.params.id, store_id: req.store.id },
        include: [
          {
            association: 'reviews',
            where: { status: 'approved' },
            required: false,
          },
        ],
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      // Incrementar visualizações
      await product.increment('views');

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar produto' });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const product = await Product.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      // Processar imagens enviadas
      let images: string[] = product.images || [];

      // Processar arquivos enviados
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Usar URL relativa para funcionar com proxy do Vite
        const uploadedImages = req.files.map((file: Express.Multer.File) =>
          `/uploads/${file.filename}`
        );

        // Se também há imagens por URL no body, combinar
        if (req.body.images && typeof req.body.images === 'string') {
          try {
            const urlImages = JSON.parse(req.body.images);
            if (Array.isArray(urlImages)) {
              images = [...uploadedImages, ...urlImages];
            } else {
              images = uploadedImages;
            }
          } catch (e) {
            images = uploadedImages;
          }
        } else {
          // Se não há URLs no body, apenas adicionar as novas imagens às existentes
          images = [...images, ...uploadedImages];
        }
      } else if (req.body.images) {
        // Se imagens vieram apenas como JSON (URLs)
        if (typeof req.body.images === 'string') {
          try {
            images = JSON.parse(req.body.images);
          } catch (e) {
            images = product.images || [];
          }
        } else if (Array.isArray(req.body.images)) {
          images = req.body.images;
        }
      }

      // Validar categoria se fornecida
      if (req.body.category_id) {
        const { Category } = await import('../models');
        const category = await Category.findOne({
          where: { id: req.body.category_id, store_id: req.store.id },
        });
        if (!category) {
          res.status(400).json({ error: 'Categoria não encontrada' });
          return;
        }
      }

      const updateData: any = { ...req.body, images };

      // Converter campos numéricos vazios para null
      if (updateData.category_id === '' || updateData.category_id === null) {
        delete updateData.category_id;
      } else if (updateData.category_id) {
        updateData.category_id = parseInt(updateData.category_id);
      }

      if (updateData.price === '' || updateData.price === null) {
        delete updateData.price;
      } else if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      if (updateData.promotional_price === '' || updateData.promotional_price === null) {
        updateData.promotional_price = null;
      } else if (updateData.promotional_price) {
        updateData.promotional_price = parseFloat(updateData.promotional_price);
      }

      if (updateData.stock_limit === '' || updateData.stock_limit === null) {
        updateData.stock_limit = null;
      } else if (updateData.stock_limit) {
        updateData.stock_limit = parseInt(updateData.stock_limit);
      }

      if (updateData.min_quantity === '' || updateData.min_quantity === null) {
        updateData.min_quantity = null;
      } else if (updateData.min_quantity) {
        updateData.min_quantity = parseInt(updateData.min_quantity);
      }

      if (updateData.max_quantity === '' || updateData.max_quantity === null) {
        updateData.max_quantity = null;
      } else if (updateData.max_quantity) {
        updateData.max_quantity = parseInt(updateData.max_quantity);
      }

      // Parse de arrays se vieram como strings
      if (typeof updateData.benefits === 'string') {
        try {
          updateData.benefits = JSON.parse(updateData.benefits);
        } catch (e) {
          updateData.benefits = [];
        }
      }
      if (typeof updateData.tags === 'string') {
        try {
          updateData.tags = JSON.parse(updateData.tags);
        } catch (e) {
          updateData.tags = [];
        }
      }

      await product.update(updateData);

      // Recarregar o produto com todas as associações
      await product.reload();

      res.json(product);
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

      const product = await Product.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      await product.destroy();

      res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir produto' });
    }
  }

  static async getKeys(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const productId = req.params.id;

      const product = await Product.findOne({
        where: { id: productId, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const productKeys = await ProductKey.findAll({
        where: { product_id: product.id },
        order: [['created_at', 'ASC']],
      });

      res.json(productKeys);
    } catch (error: any) {
      console.error('[ProductController] Error getting keys:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar chaves' });
    }
  }

  static async uploadKeys(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const productId = req.params.id;
      const { keys } = req.body;

      if (!keys) {
        res.status(400).json({ error: 'Chaves são obrigatórias' });
        return;
      }

      const product = await Product.findOne({
        where: { id: productId, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const keyArray = Array.isArray(keys) ? keys : keys.split('\n').filter((k: string) => k.trim());

      if (keyArray.length === 0) {
        res.status(400).json({ error: 'Nenhuma chave válida fornecida' });
        return;
      }

      const productKeys = await ProductKey.bulkCreate(
        keyArray.map((key: string) => ({
          product_id: product.id,
          key: key.trim(),
          is_used: false,
        }))
      );

      res.status(201).json({ count: productKeys.length, keys: productKeys });
    } catch (error: any) {
      console.error('[ProductController] Error uploading keys:', error);
      res.status(400).json({ error: error.message || 'Erro ao adicionar chaves' });
    }
  }
}


