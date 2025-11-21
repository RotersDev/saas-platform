import { Router, Request, Response, NextFunction } from 'express';
import { ThemeController } from '../controllers/themeController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';
import { upload } from '../middleware/upload';

export const themeRoutes = Router();

themeRoutes.use(authenticate);
themeRoutes.use(resolveTenant);
themeRoutes.use(requireActiveStore);

// Middleware para upload - sempre tenta processar, mas não falha se não houver arquivos
const optionalUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  console.log('[ThemeRoutes] Content-Type recebido:', contentType);
  console.log('[ThemeRoutes] Method:', req.method);
  console.log('[ThemeRoutes] Body keys:', Object.keys(req.body || {}));

  // Sempre tentar processar com multer se for PUT e tiver multipart/form-data
  // Mas também aceitar JSON normal
  if (contentType.includes('multipart/form-data')) {
    console.log('[ThemeRoutes] Processando upload com multer...');
    return upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }])(req, res, (err) => {
      if (err) {
        console.error('[ThemeRoutes] Erro no multer:', err);
        return res.status(400).json({ error: 'Erro ao processar arquivo', details: err.message });
      }
      const files = (req as any).files;
      console.log('[ThemeRoutes] Multer processado, arquivos recebidos:', files ? Object.keys(files) : 'nenhum');
      if (files) {
        if (files.logo) console.log('[ThemeRoutes] Logo:', files.logo[0]?.originalname, files.logo[0]?.size);
        if (files.favicon) console.log('[ThemeRoutes] Favicon:', files.favicon[0]?.originalname, files.favicon[0]?.size);
      }
      return next();
    });
  }
  console.log('[ThemeRoutes] Não é multipart/form-data, pulando multer');
  return next();
};

themeRoutes.get('/', ThemeController.get);
themeRoutes.put('/', requireStoreAdmin, optionalUpload, ThemeController.update);


