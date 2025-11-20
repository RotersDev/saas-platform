import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import crypto from 'crypto';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const user = await User.findOne({ where: { email } });

      if (!user || !user.is_active) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      // Atualizar último login
      await user.update({ last_login: new Date() });

      const payload: { id: number; role: string; store_id?: number } = {
        id: user.id,
        role: user.role,
      };
      if (user.store_id) {
        payload.store_id = user.store_id;
      }
      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn: StringValue | number = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;
      const options: SignOptions = { expiresIn };
      const token = jwt.sign(payload, secret, options);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          store_id: user.store_id,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        return;
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }

      // Criar usuário sem loja (será associado quando criar a loja)
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'store_admin',
        store_id: undefined, // Será preenchido quando criar a loja
        is_active: true,
      });

      // Gerar token
      const payload: { id: number; role: string; store_id?: number } = {
        id: user.id,
        role: user.role,
      };
      if (user.store_id) {
        payload.store_id = user.store_id;
      }
      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn: StringValue | number = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;
      const options: SignOptions = { expiresIn };
      const token = jwt.sign(payload, secret, options);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          store_id: user.store_id,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const user = await User.findByPk(req.user.id);
      if (!user || !user.is_active) {
        res.status(401).json({ error: 'Usuário inválido ou inativo' });
        return;
      }

      // Gerar novo token com dados atualizados
      const payload: { id: number; role: string; store_id?: number } = {
        id: user.id,
        role: user.role,
      };
      if (user.store_id) {
        payload.store_id = user.store_id;
      }
      const secret = process.env.JWT_SECRET || 'secret';
      const expiresIn: StringValue | number = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;
      const options: SignOptions = { expiresIn };
      const token = jwt.sign(payload, secret, options);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          store_id: user.store_id,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar token' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }

  /**
   * Solicita recuperação de senha
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
        return;
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      try {
        await user.update({
          reset_token: resetToken,
          reset_token_expires_at: resetTokenExpires,
        });
      } catch (updateError: any) {
        console.error('Erro ao atualizar token de reset:', updateError);
        throw updateError;
      }

      // Enviar email (não falha se email não estiver configurado)
      try {
        const emailSent = await emailService.sendPasswordResetStoreAdmin(user.email, resetToken);
        if (!emailSent) {
          console.warn('Email não foi enviado (serviço não configurado ou erro)');
        }
      } catch (emailError: any) {
        // Log do erro mas não falha a requisição
        console.error('Erro ao enviar email de recuperação:', emailError);
      }

      res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
    } catch (error: any) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        error: 'Erro ao solicitar recuperação de senha',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Redefine a senha usando o token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Token e senha são obrigatórios' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        return;
      }

      const user = await User.findOne({
        where: {
          reset_token: token,
        },
      });

      if (!user || !user.reset_token_expires_at || user.reset_token_expires_at < new Date()) {
        res.status(400).json({ error: 'Token inválido ou expirado' });
        return;
      }

      // Atualizar senha
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({
        password: hashedPassword,
        reset_token: undefined,
        reset_token_expires_at: undefined,
      });

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }
}


