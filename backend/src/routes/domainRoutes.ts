import { Router } from 'express';
import { DomainController } from '../controllers/domainController';
import { authenticate, requireStoreAdmin } from '../middleware/auth';
import { resolveTenant, requireActiveStore } from '../middleware/tenant';

export const domainRoutes = Router();

domainRoutes.use(authenticate);
domainRoutes.use(resolveTenant);
domainRoutes.use(requireActiveStore);

domainRoutes.get('/', DomainController.listDomains);
domainRoutes.put('/subdomain', requireStoreAdmin, DomainController.updateSubdomain);
domainRoutes.post('/', requireStoreAdmin, DomainController.addDomain);
domainRoutes.delete('/:id', requireStoreAdmin, DomainController.removeDomain);
domainRoutes.put('/:id/primary', requireStoreAdmin, DomainController.setPrimary);
domainRoutes.post('/:id/verify', requireStoreAdmin, DomainController.verifyDomain);

