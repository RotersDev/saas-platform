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

      // Processar imagens enviadas - agora usando Cloudflare R2
      let images: string[] = [];

      // Processar arquivos enviados - fazer upload para R2
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          const { uploadToR2 } = await import('../services/r2Service');

          // Fazer upload de todas as imagens para R2
          const uploadPromises = req.files.map((file: Express.Multer.File) =>
            uploadToR2({
              storeId: req.store!.id,
              category: 'products',
              buffer: file.buffer,
              mimeType: file.mimetype,
              originalName: file.originalname,
            })
          );

          const uploadedImages = await Promise.all(uploadPromises);
          // Remover @ do início das URLs se houver
          images = uploadedImages.map(url => url.startsWith('@') ? url.substring(1) : url);

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
        } catch (error: any) {
          console.error('[ProductController] Erro ao fazer upload para R2:', error);
          res.status(500).json({ error: `Erro ao fazer upload das imagens: ${error.message}` });
          return;
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

      // Processar tipo de estoque
      if (productData.inventory_type) {
        if (productData.inventory_type === 'file' && req.files) {
          // Procurar arquivo de estoque
          const inventoryFile = Array.isArray(req.files)
            ? req.files.find((f: Express.Multer.File) => f.fieldname === 'inventory_file')
            : null;

          if (inventoryFile) {
            try {
              const { uploadToR2 } = await import('../services/r2Service');
              const fileUrl = await uploadToR2({
                storeId: req.store.id,
                category: 'products',
                buffer: inventoryFile.buffer,
                mimeType: inventoryFile.mimetype,
                originalName: inventoryFile.originalname,
              });
              productData.inventory_file_url = fileUrl.startsWith('@') ? fileUrl.substring(1) : fileUrl;
            } catch (error: any) {
              console.error('[ProductController] Erro ao fazer upload do arquivo de estoque:', error);
            }
          }
        }

        // Limpar campos do tipo não usado
        if (productData.inventory_type !== 'text') {
          productData.inventory_text = null;
        }
        if (productData.inventory_type !== 'file') {
          productData.inventory_file_url = null;
        }
        if (productData.inventory_type !== 'lines') {
          // Não precisa fazer nada, as linhas são gerenciadas via ProductKey
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

      // Processar imagens enviadas - agora usando Cloudflare R2
      let images: string[] = product.images || [];

      // Processar arquivos enviados - fazer upload para R2
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          const { uploadToR2 } = await import('../services/r2Service');

          // Fazer upload de todas as imagens para R2
          const uploadPromises = req.files.map((file: Express.Multer.File) =>
            uploadToR2({
              storeId: req.store!.id,
              category: 'products',
              buffer: file.buffer,
              mimeType: file.mimetype,
              originalName: file.originalname,
            })
          );

          const uploadedImages = await Promise.all(uploadPromises);
          // Remover @ do início das URLs se houver
          const cleanUploadedImages = uploadedImages.map(url => url.startsWith('@') ? url.substring(1) : url);

          // Se também há imagens por URL no body, combinar
          if (req.body.images && typeof req.body.images === 'string') {
            try {
              const urlImages = JSON.parse(req.body.images);
              if (Array.isArray(urlImages)) {
                // Remover @ das URLs existentes também
                const cleanUrlImages = urlImages.map((url: string) => url.startsWith('@') ? url.substring(1) : url);
                images = [...cleanUploadedImages, ...cleanUrlImages];
              } else {
                images = cleanUploadedImages;
              }
            } catch (e) {
              images = cleanUploadedImages;
            }
          } else {
            // Se não há URLs no body, apenas adicionar as novas imagens às existentes
            images = [...images, ...cleanUploadedImages];
          }
        } catch (error: any) {
          console.error('[ProductController] Erro ao fazer upload para R2:', error);
          res.status(500).json({ error: `Erro ao fazer upload das imagens: ${error.message}` });
          return;
        }
      } else if (req.body.images !== undefined) {
        // Se imagens vieram apenas como JSON (URLs) - pode ser array vazio para remover todas
        if (typeof req.body.images === 'string') {
          try {
            const parsedImages = JSON.parse(req.body.images);
            // Se for array, usar diretamente (pode estar vazio para remover todas)
            if (Array.isArray(parsedImages)) {
              images = parsedImages.map((url: string) => url.startsWith('@') ? url.substring(1) : url);
            } else {
              images = [];
            }
          } catch (e) {
            // Se falhar o parse, usar array vazio
            images = [];
          }
        } else if (Array.isArray(req.body.images)) {
          // Se já é array, usar diretamente
          images = req.body.images.map((url: string) => (typeof url === 'string' && url.startsWith('@')) ? url.substring(1) : url);
        } else {
          // Se não é array nem string, manter as imagens existentes
          images = product.images || [];
        }
      } else {
        // Se não há imagens no body e não há arquivos, manter as imagens existentes
        images = product.images || [];
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

      // Processar tipo de estoque
      if (updateData.inventory_type !== undefined) {
        if (updateData.inventory_type === 'file' && req.files) {
          // Procurar arquivo de estoque
          const inventoryFile = Array.isArray(req.files)
            ? req.files.find((f: Express.Multer.File) => f.fieldname === 'inventory_file')
            : null;

          if (inventoryFile) {
            try {
              const { uploadToR2 } = await import('../services/r2Service');
              const fileUrl = await uploadToR2({
                storeId: req.store.id,
                category: 'products',
                buffer: inventoryFile.buffer,
                mimeType: inventoryFile.mimetype,
                originalName: inventoryFile.originalname,
              });
              updateData.inventory_file_url = fileUrl.startsWith('@') ? fileUrl.substring(1) : fileUrl;
            } catch (error: any) {
              console.error('[ProductController] Erro ao fazer upload do arquivo de estoque:', error);
            }
          } else if (updateData.inventory_file_url === '') {
            // Se enviou string vazia, manter o arquivo atual
            delete updateData.inventory_file_url;
          }
        }

        // Limpar campos do tipo não usado
        if (updateData.inventory_type !== 'text') {
          updateData.inventory_text = null;
        }
        if (updateData.inventory_type !== 'file') {
          updateData.inventory_file_url = null;
        }
        if (updateData.inventory_type !== 'lines') {
          // Não precisa fazer nada, as linhas são gerenciadas via ProductKey
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

      // Retornar apenas chaves não usadas (disponíveis)
      const availableKeys = productKeys.filter((pk: any) => !pk.is_used);
      res.json(availableKeys);
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

  static async deleteKey(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const productId = req.params.id;
      const keyId = req.params.keyId;

      const product = await Product.findOne({
        where: { id: productId, store_id: req.store.id },
      });

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      const productKey = await ProductKey.findOne({
        where: { id: keyId, product_id: product.id },
      });

      if (!productKey) {
        res.status(404).json({ error: 'Chave não encontrada' });
        return;
      }

      // Não permitir deletar chaves já usadas
      if (productKey.is_used) {
        res.status(400).json({ error: 'Não é possível deletar uma chave já utilizada' });
        return;
      }

      await productKey.destroy();
      res.json({ message: 'Chave removida com sucesso' });
    } catch (error: any) {
      console.error('[ProductController] Error deleting key:', error);
      res.status(500).json({ error: error.message || 'Erro ao remover chave' });
    }
  }

  static async deleteAllKeys(req: TenantRequest, res: Response): Promise<void> {
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

      // Deletar TODAS as chaves (não apenas não usadas, pois agora deletamos quando usadas)
      const deletedCount = await ProductKey.destroy({
        where: { product_id: product.id },
      });

      res.json({ message: `${deletedCount} chave(s) removida(s) com sucesso`, count: deletedCount });
    } catch (error: any) {
      console.error('[ProductController] Error deleting all keys:', error);
      res.status(500).json({ error: error.message || 'Erro ao remover chaves' });
    }
  }
}


