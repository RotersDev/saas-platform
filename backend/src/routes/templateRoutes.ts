import { Router } from 'express';
import { TemplateController } from '../controllers/templateController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const templateRoutes = Router();

templateRoutes.use(authenticate);
templateRoutes.use(resolveTenant);
templateRoutes.use(requireActiveStore);

// Listar templates
templateRoutes.get('/', TemplateController.list);

// Buscar template ativo
templateRoutes.get('/active', TemplateController.getActive);

// Criar template padrão
templateRoutes.post('/default', requireStoreAdmin, TemplateController.createDefault);

// Criar novo template
templateRoutes.post('/', requireStoreAdmin, TemplateController.create);

// Buscar template específico
templateRoutes.get('/:id', TemplateController.get);

// Atualizar template
templateRoutes.put('/:id', requireStoreAdmin, TemplateController.update);

// Ativar template
templateRoutes.post('/:id/activate', requireStoreAdmin, TemplateController.activate);

// Deletar template
templateRoutes.delete('/:id', requireStoreAdmin, TemplateController.delete);

