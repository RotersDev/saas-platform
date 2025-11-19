import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

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


