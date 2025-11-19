import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, requireMasterAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(requireMasterAdmin);

// Lojas
adminRoutes.get('/stores', AdminController.listStores);
adminRoutes.post('/stores', upload.single('banner'), (req, res, next) => {
  // Multer adiciona o arquivo em req.file
  next();
}, AdminController.createStore);
adminRoutes.get('/stores/:id', AdminController.getStore);
adminRoutes.put('/stores/:id', AdminController.updateStore);
adminRoutes.post('/stores/:id/suspend', AdminController.suspendStore);
adminRoutes.post('/stores/:id/block', AdminController.blockStore);
adminRoutes.post('/stores/:id/activate', AdminController.activateStore);
adminRoutes.delete('/stores/:id', AdminController.deleteStore);

// Planos
adminRoutes.get('/plans', AdminController.listPlans);
adminRoutes.post('/plans', AdminController.createPlan);
adminRoutes.put('/plans/:id', AdminController.updatePlan);
adminRoutes.delete('/plans/:id', AdminController.deletePlan);

// Estatísticas
adminRoutes.get('/stats', AdminController.getStats);

// Faturas
adminRoutes.get('/invoices', AdminController.listInvoices);


