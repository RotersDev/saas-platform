import { Response } from 'express';
import { Order } from '../models';
import { CustomerAuthRequest } from './customerAuthController';

export class CustomerOrdersController {
  /**
   * Listar pedidos do cliente autenticado
   */
  static async listMyOrders(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.customer || !req.store) {
        res.status(400).json({ error: 'Cliente ou loja não encontrada' });
        return;
      }

      // Verificar se o cliente pertence à loja
      if (req.customer.store_id !== req.store.id) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const orders = await Order.findAll({
        where: {
          store_id: req.store.id,
          customer_id: req.customer.id,
        },
        include: [
          { association: 'items' },
          {
            association: 'payment',
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
  }

  /**
   * Obter detalhes de um pedido específico do cliente
   */
  static async getMyOrder(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.customer || !req.store) {
        res.status(400).json({ error: 'Cliente ou loja não encontrada' });
        return;
      }

      const { Op } = require('sequelize');
      const orderIdentifier = decodeURIComponent(req.params.id);

      // Buscar pedido por order_number ou ID
      const order = await Order.findOne({
        where: {
          store_id: req.store.id,
          customer_id: req.customer.id,
          [Op.or]: [
            { order_number: orderIdentifier },
            { id: isNaN(Number(orderIdentifier)) ? -1 : Number(orderIdentifier) },
          ],
        },
        include: [
          { association: 'items' },
          {
            association: 'payment',
            required: false,
          },
        ],
      });

      if (!order) {
        res.status(404).json({ error: 'Pedido não encontrado' });
        return;
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pedido' });
    }
  }
}

