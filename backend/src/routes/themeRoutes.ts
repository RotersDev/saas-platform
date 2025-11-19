import { Router, Request, Response, NextFunction } from 'express';
import { ThemeController } from '../controllers/themeController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';
import { upload } from '../middleware/upload';

export const themeRoutes = Router();

themeRoutes.use(authenticate);
themeRoutes.use(resolveTenant);
themeRoutes.use(requireActiveStore);

// Middleware opcional para upload (só processa se Content-Type for multipart/form-data)
const optionalUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }])(req, res, next);
  }
  next();
};

themeRoutes.get('/', ThemeController.get);
themeRoutes.put('/', requireStoreAdmin, optionalUpload, ThemeController.update);


