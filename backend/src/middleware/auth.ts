import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserSession } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    store_id?: number;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      res.status(401).json({ error: 'Usuário inválido ou inativo' });
      return;
    }

    req.user = {
      id: user.id,
      store_id: user.store_id || undefined,
      role: user.role,
      email: user.email,
    };

    // Verificar se a sessão está ativa antes de autenticar
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const session = await UserSession.findOne({
        where: {
          user_id: user.id,
          token_hash: tokenHash,
        },
      });

      // Se a sessão não existe ou está inativa, negar acesso
      if (!session || !session.is_active) {
        res.status(401).json({ error: 'Sessão inválida ou expirada' });
        return;
      }

      // Atualizar última atividade da sessão
      await session.update({ last_activity: new Date() });
    } catch (sessionError: any) {
      // Log erro mas não falhar a autenticação se for erro de conexão
      console.error('[AuthMiddleware] Erro ao verificar sessão:', sessionError);
      // Se for erro de tabela não encontrada, permitir continuar (compatibilidade)
      if (sessionError.message?.includes('does not exist') || sessionError.message?.includes('relation')) {
        console.warn('[AuthMiddleware] Tabela de sessões não encontrada, continuando sem verificação');
      } else {
        // Para outros erros, negar acesso por segurança
        res.status(401).json({ error: 'Erro ao verificar sessão' });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  };
};

export const requireMasterAdmin = requireRole('master_admin');
export const requireStoreAdmin = requireRole('store_admin', 'master_admin');


