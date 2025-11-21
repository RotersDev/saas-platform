import { Request, Response, NextFunction } from 'express';
import { Store } from '../models';
import { AuthRequest } from './auth';
import sequelize from '../config/database';

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

    // Se usuário não tem store_id mas está autenticado, tentar encontrar loja pelo email
    if (req.user && !req.user.store_id) {
      const { User } = await import('../models');
      const user = await User.findByPk(req.user.id);
      if (user && user.email) {
        // Buscar loja pelo email do usuário
        const storeByEmail = await Store.findOne({
          where: { email: user.email.toLowerCase() }
        });
        if (storeByEmail) {
          // Atualizar store_id do usuário
          await user.update({ store_id: storeByEmail.id }).catch(() => {
            // Ignorar erro se não conseguir atualizar
          });

          if (storeByEmail.status === 'blocked' || storeByEmail.status === 'suspended') {
            res.status(403).json({ error: 'Loja bloqueada ou suspensa' });
            return;
          }

          req.store = storeByEmail;
          next();
          return;
        }
      }
    }

    // Tentar resolver por header X-Store-Subdomain (para desenvolvimento/frontend)
    const subdomainHeader = req.headers['x-store-subdomain'] as string;
    if (subdomainHeader) {
      const store = await Store.findOne({ where: { subdomain: subdomainHeader } });
      if (store) {
        // Verificar se o usuário tem acesso a esta loja
        if (req.user && req.user.role !== 'master_admin') {
          // Buscar usuário completo para verificar store_id e email
          const { User } = await import('../models');
          const user = await User.findByPk(req.user.id);

          if (user) {
            // Se o usuário tem store_id, deve ser o mesmo da loja
            if (user.store_id && user.store_id !== store.id) {
              res.status(403).json({ error: 'Acesso negado a esta loja' });
              return;
            }

            // Se não tem store_id mas o email da loja corresponde ao do usuário, permitir acesso
            // Isso resolve casos onde o store_id não foi atualizado após criação da loja
            if (!user.store_id && store.email && store.email.toLowerCase() === user.email.toLowerCase()) {
              // Atualizar store_id do usuário para facilitar próximas requisições
              await user.update({ store_id: store.id }).catch(() => {
                // Ignorar erro se não conseguir atualizar
              });
            } else if (!user.store_id) {
              // Se não tem store_id e email não corresponde, verificar se há outros usuários da loja
              const storeUsers = await User.findAll({ where: { store_id: store.id } });
              // Se não há usuários associados à loja e o usuário atual não tem loja, permitir acesso
              // (caso onde o usuário está criando/configurando a loja)
              if (storeUsers.length === 0) {
                // Atualizar store_id do usuário
                await user.update({ store_id: store.id }).catch(() => {
                  // Ignorar erro se não conseguir atualizar
                });
              } else {
                res.status(403).json({ error: 'Acesso negado a esta loja' });
                return;
              }
            }
          }
        }

        if (store.status === 'blocked' || store.status === 'suspended') {
          res.status(403).json({ error: 'Loja bloqueada ou suspensa' });
          return;
        }

        req.store = store;
        next();
        return;
      }
    }

    // Tentar resolver por subdomain do host
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'localhost' && subdomain !== '127') {
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
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verificar se a conexão com o banco está estabelecida
    try {
      await sequelize.authenticate();
    } catch (authError) {
      console.error('Erro de autenticação do Sequelize no middleware:', authError);
      // Continuar mesmo com erro de autenticação
    }

    // Primeiro, tentar resolver por header X-Store-Subdomain (para desenvolvimento)
    const subdomainHeader = req.headers['x-store-subdomain'] as string;
    console.log('[resolveTenantPublic] 📨 Header X-Store-Subdomain:', subdomainHeader || 'não enviado');

    if (subdomainHeader) {
      try {
        const store = await Store.findOne({ where: { subdomain: subdomainHeader } });
        if (store) {
          console.log('[resolveTenantPublic] ✅ Loja encontrada via header:', store.name, '| ID:', store.id);
          (req as any).store = store;
          next();
          return;
        } else {
          console.log('[resolveTenantPublic] ⚠️ Loja não encontrada via header para subdomain:', subdomainHeader);
        }
      } catch (error: any) {
        console.error('[resolveTenantPublic] ❌ Erro ao buscar loja por header:', error);
        // Continuar para tentar outros métodos
      }
    }

    // Tentar resolver por host
    const host = req.headers.host || '';
    // Remover porta se houver (ex: marcos.nerix.online:443 -> marcos.nerix.online)
    const hostWithoutPort = host.split(':')[0];
    const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';

    // Primeiro, verificar se é um domínio customizado (não é subdomínio do BASE_DOMAIN nem SAAS_DOMAIN)
    const isBaseDomain = hostWithoutPort === baseDomain || hostWithoutPort === `www.${baseDomain}`;
    const isSaasDomain = hostWithoutPort === saasDomain || hostWithoutPort === `www.${saasDomain}`;
    const isSubdomainOfBase = hostWithoutPort.endsWith(`.${baseDomain}`) && !isBaseDomain;
    const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1' || hostWithoutPort.includes('localhost');
    const isIP = hostWithoutPort.match(/^\d+\.\d+\.\d+\.\d+$/);

    // Se não é subdomínio do BASE_DOMAIN, não é SAAS_DOMAIN, não é localhost e não é IP, pode ser domínio customizado
    if (!isSubdomainOfBase && !isBaseDomain && !isSaasDomain && !isLocalhost && !isIP) {
      try {
        const { Domain } = await import('../models');
        console.log('[resolveTenantPublic] 🔍 Tentando resolver como domínio customizado:', hostWithoutPort);

        // Buscar domínio customizado no banco
        // IMPORTANTE: Se o domínio foi removido, não deve ser encontrado aqui
        const customDomain = await Domain.findOne({
          where: { domain: hostWithoutPort },
        });

        if (customDomain) {
          // Verificar se a loja ainda existe
          const store = await Store.findByPk(customDomain.store_id);
          if (store) {
            console.log('[resolveTenantPublic] ✅ Loja encontrada via domínio customizado:', store.name, '| ID:', store.id, '| Domain:', hostWithoutPort, '| Verified:', customDomain.verified);
            (req as any).store = store;
            next();
            return;
          } else {
            console.log('[resolveTenantPublic] ⚠️ Domínio customizado encontrado, mas loja não existe:', hostWithoutPort, '| Store ID:', customDomain.store_id);
          }
        } else {
          console.log('[resolveTenantPublic] ⚠️ Domínio customizado não encontrado no banco (pode ter sido removido):', hostWithoutPort);
          // Se o domínio não foi encontrado, não definir req.store
          // Isso fará com que a loja não seja encontrada e retorne erro 404
        }
      } catch (error: any) {
        console.error('[resolveTenantPublic] ❌ Erro ao buscar domínio customizado:', error);
      }
    }

    // Se é subdomínio do BASE_DOMAIN, tentar resolver por subdomain
    if (isSubdomainOfBase) {
      const hostParts = hostWithoutPort.split('.');
      const subdomain = hostParts[0]; // Primeira parte é o subdomínio

      if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
        try {
          console.log('[resolveTenantPublic] 🔍 Buscando loja no banco com subdomain:', subdomain);
          const store = await Store.findOne({ where: { subdomain } });
          if (store) {
            console.log('[resolveTenantPublic] ✅ Loja encontrada via subdomain:', store.name, '| ID:', store.id, '| Subdomain:', store.subdomain);
            (req as any).store = store;
            next();
            return;
          } else {
            console.warn('[resolveTenantPublic] ⚠️ Loja NÃO encontrada no banco para subdomain:', subdomain);
          }
        } catch (error: any) {
          console.error('[resolveTenantPublic] ❌ Erro ao buscar loja por subdomain:', error);
        }
      }
    }

    // Log para debug
    console.log('[resolveTenantPublic] 🔍 Host:', host, '| Host sem porta:', hostWithoutPort, '| isSubdomainOfBase:', isSubdomainOfBase, '| isBaseDomain:', isBaseDomain, '| isSaasDomain:', isSaasDomain);

    // Se não encontrar, permitir continuar (pode ser acesso direto)
    next();
  } catch (error: any) {
    console.error('Erro ao resolver tenant público:', error);
    // Em caso de erro, permitir continuar sem loja
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


