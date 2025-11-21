import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { upload, uploadMultiple } from '../middleware/upload';

export const uploadRoutes = Router();

// Rotas protegidas - apenas lojistas autenticados
uploadRoutes.use(authenticate);
uploadRoutes.use(resolveTenant);
uploadRoutes.use(requireStoreAdmin);

// Upload de imagem única
uploadRoutes.post('/image', upload.single('file'), UploadController.uploadImage);

// Upload de múltiplas imagens
uploadRoutes.post('/images', uploadMultiple.array('files', 10), UploadController.uploadMultipleImages);




