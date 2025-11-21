import { Router } from 'express';
import { VisitController } from '../controllers/visitController';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import { requireStoreAdmin } from '../middleware/auth';

export const visitRoutes = Router();

visitRoutes.use(authenticate);
visitRoutes.use(resolveTenant);
visitRoutes.use(requireStoreAdmin);

visitRoutes.get('/', VisitController.getVisits);
visitRoutes.get('/stats', VisitController.getVisitStats);


