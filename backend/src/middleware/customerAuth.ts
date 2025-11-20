import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Customer } from '../models';
import { CustomerAuthRequest } from '../controllers/customerAuthController';

/**
 * Middleware para autenticar clientes (não lojistas)
 */
export const authenticateCustomer = async (
  req: CustomerAuthRequest,
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

    // Verificar se é token de cliente
    if (decoded.type !== 'customer') {
      res.status(401).json({ error: 'Token inválido para cliente' });
      return;
    }

    const customer = await Customer.findByPk(decoded.customer_id);

    if (!customer) {
      res.status(401).json({ error: 'Cliente não encontrado' });
      return;
    }

    if (customer.is_blocked) {
      res.status(403).json({ error: 'Conta bloqueada' });
      return;
    }

    // Verificar se o cliente pertence à loja correta
    if (req.store && customer.store_id !== req.store.id) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    req.customer = {
      id: customer.id,
      store_id: customer.store_id,
      email: customer.email,
      name: customer.name,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

