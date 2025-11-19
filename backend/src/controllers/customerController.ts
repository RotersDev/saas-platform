import { Response } from 'express';
import { Customer } from '../models';
import { TenantRequest } from '../middleware/tenant';

export class CustomerController {
  static async list(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { page = 1, limit = 20, search, blocked_only } = req.query;

      const where: any = { store_id: req.store.id };

      if (search) {
        where[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        ];
      }

      const { Op } = require('sequelize');
      const { Order } = require('../models');
      const { sequelize } = require('../models');

      // Buscar apenas clientes que têm pelo menos um pedido pago
      const whereClause: any = {
        store_id: req.store.id,
      };

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Filtro para clientes bloqueados
      if (blocked_only === 'true') {
        whereClause.is_blocked = true;
      }

      // Se mostrar apenas bloqueados, não exigir pedidos pagos
      // Caso contrário, só mostrar clientes com pedidos pagos
      const includeOrders = blocked_only !== 'true' ? [
        {
          model: Order,
          as: 'orders',
          where: {
            payment_status: 'paid',
          },
          required: true, // INNER JOIN - só clientes com pedidos pagos
          attributes: [],
        },
      ] : [];

      // Query para buscar clientes
      const queryOptions: any = {
        where: whereClause,
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'is_blocked',
          'created_at',
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM orders
              WHERE orders.customer_id = "Customer".id
              AND orders.payment_status = 'paid'
            )`),
            'total_orders',
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(orders.total), 0)
              FROM orders
              WHERE orders.customer_id = "Customer".id
              AND orders.payment_status = 'paid'
            )`),
            'total_spent',
          ],
        ],
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
      };

      // Adicionar include apenas se necessário
      if (includeOrders.length > 0) {
        queryOptions.include = includeOrders;
        queryOptions.distinct = true;
        queryOptions.subQuery = false;
      }

      const customers = await Customer.findAndCountAll(queryOptions);

      // Formatar dados
      const formattedCustomers = {
        rows: customers.rows.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          is_blocked: c.is_blocked,
          total_orders: Number(c.get('total_orders') || 0),
          total_spent: Number(c.get('total_spent') || 0),
          created_at: c.created_at,
        })),
        count: customers.count,
      };

      res.json(formattedCustomers);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  }

  static async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const customer = await Customer.findOne({
        where: { id: req.params.id, store_id: req.store.id },
        include: [{ association: 'orders' }],
      });

      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  static async block(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const customer = await Customer.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      await customer.update({ is_blocked: true });

      res.json({ message: 'Cliente bloqueado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao bloquear cliente' });
    }
  }

  static async unblock(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const customer = await Customer.findOne({
        where: { id: req.params.id, store_id: req.store.id },
      });

      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      await customer.update({ is_blocked: false });

      res.json({ message: 'Cliente desbloqueado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desbloquear cliente' });
    }
  }

  static async blockByEmailOrIp(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { email, ip } = req.body;

      if (!email && !ip) {
        res.status(400).json({ error: 'E-mail ou IP é obrigatório' });
        return;
      }

      if (email) {
        // Bloquear todos os clientes com este email
        await Customer.update(
          { is_blocked: true },
          {
            where: {
              store_id: req.store.id,
              email: email,
            },
          }
        );
      }

      if (ip) {
        // Bloquear por IP - buscar pedidos com este IP e bloquear clientes
        const { Order } = require('../models');
        const orders = await Order.findAll({
          where: {
            store_id: req.store.id,
          },
        });

        // Filtrar pedidos com este IP no metadata
        const ordersWithIp = orders.filter((o: any) => {
          const metadata = o.metadata || {};
          return metadata.ip_address === ip;
        });

        // Bloquear todos os clientes desses pedidos
        const customerIds = ordersWithIp.map((o: any) => o.customer_id).filter(Boolean);
        if (customerIds.length > 0) {
          await Customer.update(
            { is_blocked: true },
            {
              where: {
                id: customerIds,
                store_id: req.store.id,
              },
            }
          );
        }
      }

      res.json({ message: 'Bloqueio aplicado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao bloquear cliente' });
    }
  }
}


