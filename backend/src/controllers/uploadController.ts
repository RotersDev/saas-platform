import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant';
import { uploadToR2 } from '../services/r2Service';

export class UploadController {
  /**
   * Upload de imagem genérica para R2
   */
  static async uploadImage(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const category = (req.body.category || 'products') as 'products' | 'logos' | 'favicons' | 'banners' | 'profile';

      // Fazer upload para R2
      const url = await uploadToR2({
        storeId: req.store.id,
        category,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      });

      res.json({
        success: true,
        url,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao fazer upload:', error);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }
  }

  /**
   * Upload de múltiplas imagens para R2
   */
  static async uploadMultipleImages(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const category = (req.body.category || 'products') as 'products' | 'logos' | 'favicons' | 'banners' | 'profile';

      // Fazer upload de todas as imagens
      const uploadPromises = req.files.map((file: Express.Multer.File) =>
        uploadToR2({
          storeId: req.store!.id,
          category,
          buffer: file.buffer,
          mimeType: file.mimetype,
          originalName: file.originalname,
        })
      );

      const urls = await Promise.all(uploadPromises);

      res.json({
        success: true,
        urls,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao fazer upload múltiplo:', error);
      res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
    }
  }
}




