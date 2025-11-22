import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Customer } from '../models';
import { OAuth2Client } from 'google-auth-library';
import emailService from '../services/emailService';
import { getClientIp } from '../utils/deviceParser';

export interface CustomerAuthRequest extends Request {
  customer?: {
    id: number;
    store_id: number;
    email: string;
    name: string;
  };
  store?: any;
}

export class CustomerAuthController {
  /**
   * Registro de novo cliente na loja
   */
  static async register(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { email, password, name, phone } = req.body;

      if (!email || !name) {
        res.status(400).json({ error: 'Email e nome são obrigatórios' });
        return;
      }

      // Verificar se cliente já existe nesta loja
      const existingCustomer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          email: email.toLowerCase(),
        },
      });

      if (existingCustomer) {
        // Se já existe mas não tem senha, atualizar com senha e IP
        if (!existingCustomer.password && password) {
          const clientIp = getClientIp(req);
          const hashedPassword = await bcrypt.hash(password, 10);
          await existingCustomer.update({
            password: hashedPassword,
            ip_address: clientIp,
          });

          const token = jwt.sign(
            { customer_id: existingCustomer.id, store_id: req.store.id, type: 'customer' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
          );

          res.json({
            token,
            customer: {
              id: existingCustomer.id,
              email: existingCustomer.email,
              name: existingCustomer.name,
            },
          });
          return;
        }

        res.status(400).json({ error: 'Email já cadastrado nesta loja' });
        return;
      }

      // Capturar IP do cliente
      const clientIp = getClientIp(req);
      console.log('[CustomerAuthController] Registro - IP capturado:', clientIp);

      // Criar novo cliente
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      const customer = await Customer.create({
        store_id: req.store.id,
        email: email.toLowerCase(),
        name,
        phone,
        password: hashedPassword,
        ip_address: clientIp,
        is_blocked: false,
        total_orders: 0,
        total_spent: 0,
      });

      // Gerar token apenas se tiver senha
      let token = null;
      if (password) {
        token = jwt.sign(
          { customer_id: customer.id, store_id: req.store.id, type: 'customer' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30d' }
        );
      }

      res.status(201).json({
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao cadastrar cliente' });
    }
  }

  /**
   * Login de cliente
   */
  static async login(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const customer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          email: email.toLowerCase(),
        },
      });

      if (!customer) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      if (customer.is_blocked) {
        res.status(403).json({ error: 'Conta bloqueada' });
        return;
      }

      if (!customer.password) {
        res.status(400).json({
          error: 'Conta criada sem senha. Use o e-mail usado nas compras para criar uma senha.',
          needs_password: true
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, customer.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      // Atualizar IP do cliente no login
      const clientIp = getClientIp(req);
      console.log('[CustomerAuthController] Login - IP capturado:', clientIp);
      await customer.update({ ip_address: clientIp });

      const token = jwt.sign(
        { customer_id: customer.id, store_id: req.store.id, type: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  /**
   * Criar senha para cliente existente (que comprou sem cadastro)
   */
  static async createPassword(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const customer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          email: email.toLowerCase(),
        },
      });

      if (!customer) {
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      if (customer.password) {
        res.status(400).json({ error: 'Cliente já possui senha cadastrada' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await customer.update({ password: hashedPassword });

      const token = jwt.sign(
        { customer_id: customer.id, store_id: req.store.id, type: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao criar senha' });
    }
  }

  /**
   * Login com Google OAuth
   */
  static async loginWithGoogle(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id_token } = req.body;

      if (!id_token) {
        res.status(400).json({ error: 'Token do Google é obrigatório' });
        return;
      }

      // Verificar token do Google
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
      } catch (error) {
        res.status(401).json({ error: 'Token do Google inválido' });
        return;
      }

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(400).json({ error: 'Dados do Google inválidos' });
        return;
      }

      const googleEmail = payload.email.toLowerCase();
      const googleName = payload.name || payload.given_name || 'Usuário';
      const googlePicture = payload.picture;

      // Buscar ou criar cliente
      let customer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          email: googleEmail,
        },
      });

      if (!customer) {
        // Capturar IP do cliente
        const clientIp = getClientIp(req);
        console.log('[CustomerAuthController] Login Google - IP capturado:', clientIp);

        // Criar novo cliente sem senha (login apenas com Google)
        customer = await Customer.create({
          store_id: req.store.id,
          email: googleEmail,
          ip_address: clientIp,
          name: googleName,
          phone: undefined,
          password: undefined, // Sem senha, login apenas com Google
          is_blocked: false,
          total_orders: 0,
          total_spent: 0,
        });
      } else {
        // Verificar se está bloqueado
        if (customer.is_blocked) {
          res.status(403).json({ error: 'Conta bloqueada' });
          return;
        }

        // Atualizar IP do cliente no login
        const clientIp = getClientIp(req);
        console.log('[CustomerAuthController] Login Google (existente) - IP capturado:', clientIp);
        await customer.update({ ip_address: clientIp });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { customer_id: customer.id, store_id: req.store.id, type: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      res.json({
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          picture: googlePicture,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao fazer login com Google' });
    }
  }

  /**
   * Solicita recuperação de senha para cliente
   */
  static async requestPasswordReset(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      const customer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          email: email.toLowerCase(),
        },
      });

      if (!customer) {
        // Por segurança, não revelar se o email existe ou não
        res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
        return;
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await customer.update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpires,
      });

      // Enviar email
      await emailService.sendPasswordResetCustomer(
        customer.email,
        resetToken,
        req.store.name,
        req.store.subdomain,
        req.store.domain
      );

      res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
    }
  }

  /**
   * Redefine a senha do cliente usando o token
   */
  static async resetPassword(req: CustomerAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Token e senha são obrigatórios' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        return;
      }

      const customer = await Customer.findOne({
        where: {
          store_id: req.store.id,
          reset_token: token,
        },
      });

      if (!customer || !customer.reset_token_expires_at || customer.reset_token_expires_at < new Date()) {
        res.status(400).json({ error: 'Token inválido ou expirado' });
        return;
      }

      // Atualizar senha
      const hashedPassword = await bcrypt.hash(password, 10);
      await customer.update({
        password: hashedPassword,
        reset_token: undefined,
        reset_token_expires_at: undefined,
      });

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }
}

