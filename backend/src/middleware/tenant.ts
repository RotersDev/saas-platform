import { Request, Response, NextFunction } from 'express';
import { Store } from '../models';
import { AuthRequest } from './auth';

export interface TenantRequest extends AuthRequest {
  store?: Store;
}

export const resolveTenant = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Se for master admin, pode acessar qualquer loja via query param
    if (req.user?.role === 'master_admin' && req.query.store_id) {
      const store = await Store.findByPk(Number(req.query.store_id));
      if (store) {
        req.store = store;
        next();
        return;
      }
    }

    // Para usuários de loja, usar o store_id do usuário
    if (req.user?.store_id) {
      const store = await Store.findByPk(req.user.store_id);
      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      if (store.status === 'blocked' || store.status === 'suspended') {
        res.status(403).json({ error: 'Loja bloqueada ou suspensa' });
        return;
      }

      req.store = store;
      next();
      return;
    }

    // Tentar resolver por subdomain
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
      const store = await Store.findOne({ where: { subdomain } });
      if (store) {
        req.store = store;
        next();
        return;
      }
    }

    res.status(404).json({ error: 'Loja não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resolver tenant' });
  }
};

// Resolver tenant para rotas públicas (sem autenticação)
export const resolveTenantPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Primeiro, tentar resolver por header X-Store-Subdomain (para desenvolvimento)
    const subdomainHeader = req.headers['x-store-subdomain'] as string;
    if (subdomainHeader) {
      const store = await Store.findOne({ where: { subdomain: subdomainHeader } });
      if (store) {
        (req as any).store = store;
        next();
        return;
      }
    }

    // Tentar resolver por subdomain do host
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'localhost') {
      const store = await Store.findOne({ where: { subdomain } });
      if (store) {
        (req as any).store = store;
        next();
        return;
      }
    }

    // Tentar resolver por domínio customizado
    const domain = host.split(':')[0];
    const { Domain } = await import('../models');
    const customDomain = await Domain.findOne({
      where: { domain, verified: true },
    });

    if (customDomain) {
      const store = await Store.findByPk(customDomain.store_id);
      if (store) {
        (req as any).store = store;
        next();
        return;
      }
    }

    // Se não encontrar, permitir continuar (pode ser acesso direto)
    next();
  } catch (error) {
    next();
  }
};

export const requireActiveStore = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.store) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }

  // Permitir acesso se a loja estiver ativa, em trial, ou se for master admin
  const allowedStatuses = ['active', 'trial'];
  if (!allowedStatuses.includes(req.store.status) && req.user?.role !== 'master_admin') {
    res.status(403).json({ error: 'Loja inativa' });
    return;
  }

  next();
};


