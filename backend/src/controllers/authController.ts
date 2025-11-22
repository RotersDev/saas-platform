import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import crypto from 'crypto';
import { User, UserSession } from '../models';
import { AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';
import logger from '../config/logger';
import { parseUserAgent, getClientIp } from '../utils/deviceParser';
import { getIPInfo, formatLocation } from '../services/ipInfoService';

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

      // Criar hash do token para armazenar na sessão
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Capturar informações do dispositivo e IP
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = parseUserAgent(userAgent);

      const finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
      console.log('[AuthController] IP capturado:', finalIp);
      console.log('[AuthController] User Agent:', userAgent);
      console.log('[AuthController] Device Info:', deviceInfo);

      // Buscar informações de localização do IP (assíncrono, não bloquear login)
      let location = '';
      let city = '';
      let region = '';
      let country = '';
      try {
        const ipInfo = await getIPInfo(finalIp);
        if (ipInfo) {
          location = formatLocation(ipInfo);
          city = ipInfo.city || '';
          region = ipInfo.region || '';
          country = ipInfo.country || '';
          console.log('[AuthController] IP:', finalIp);
          console.log('[AuthController] IPInfo completo:', JSON.stringify(ipInfo, null, 2));
          console.log('[AuthController] Localização:', location, '| Cidade:', city, '| Região:', region, '| País:', country);
        } else {
          console.log('[AuthController] IPInfo retornou null para IP:', finalIp);
        }
      } catch (locationError: any) {
        console.error('[AuthController] Erro ao buscar localização:', locationError.message);
        // Em caso de erro, não usar valores padrão - deixar vazio
        location = '';
        city = '';
        region = '';
        country = '';
      }

      // Criar sessão do usuário
      try {
        console.log('[AuthController] Criando sessão com:', {
          ip: finalIp,
          city: city || '(não detectada)',
          region: region || '(não detectada)',
          country: country || '(não detectada)',
        });

        const session = await UserSession.create({
          user_id: user.id,
          token_hash: tokenHash,
          ip_address: finalIp,
          user_agent: userAgent,
          device_info: deviceInfo,
          location: location || '',
          city: city || undefined,
          region: region || undefined,
          country: country || undefined,
          is_active: true,
          last_activity: new Date(),
        });
        console.log('[AuthController] Sessão criada com sucesso:', session.id);
        console.log('[AuthController] Sessão criada - IP:', session.ip_address, 'cidade:', session.city || '(não detectada)', 'região:', session.region || '(não detectada)', 'país:', session.country || '(não detectada)');
      } catch (sessionError: any) {
        // Log erro mas não falhar o login
        console.error('[AuthController] Erro ao criar sessão:', sessionError);
        logger.error('Erro ao criar sessão de usuário', { error: sessionError.message, stack: sessionError.stack });
      }

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name || null,
          username: (user as any).username || null,
          profile_picture_url: (user as any).profile_picture_url || null,
          email: user.email,
          role: user.role,
          store_id: user.store_id,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Erro ao fazer login:', error);
      logger.error('Erro ao fazer login', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Erro ao fazer login', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, username } = req.body;

      if (!email || !password || !username || !name) {
        res.status(400).json({ error: 'Nome completo, username, email e senha são obrigatórios' });
        return;
      }

      // Validar username
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        res.status(400).json({ error: 'Username deve ter 3-20 caracteres e conter apenas letras, números e underscore' });
        return;
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }

      // Verificar se username já existe
      const existingUsername = await User.findOne({ where: { username: username.toLowerCase() } });
      if (existingUsername) {
        res.status(400).json({ error: 'Username já está em uso' });
        return;
      }

      // Criar usuário sem loja (será associado quando criar a loja)
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name.trim(),
        username: username.toLowerCase().trim(),
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

      // Criar hash do token para armazenar na sessão
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Capturar informações do dispositivo e IP
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = parseUserAgent(userAgent);

      const finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
      console.log('[AuthController] Registro - IP capturado:', finalIp);
      console.log('[AuthController] Registro - User Agent:', userAgent);
      console.log('[AuthController] Registro - Device Info:', deviceInfo);

      // Buscar informações de localização do IP (assíncrono, não bloquear registro)
      let location = '';
      let city = '';
      let region = '';
      let country = '';
      try {
        const ipInfo = await getIPInfo(finalIp);
        if (ipInfo) {
          location = formatLocation(ipInfo);
          city = ipInfo.city || '';
          region = ipInfo.region || '';
          country = ipInfo.country || '';
          console.log('[AuthController] Registro - IP:', finalIp);
          console.log('[AuthController] Registro - IPInfo completo:', JSON.stringify(ipInfo, null, 2));
          console.log('[AuthController] Registro - Localização:', location, '| Cidade:', city, '| Região:', region, '| País:', country);
        } else {
          console.log('[AuthController] Registro - IPInfo retornou null para IP:', finalIp);
        }
      } catch (locationError: any) {
        console.error('[AuthController] Registro - Erro ao buscar localização:', locationError.message);
        // Em caso de erro, não usar valores padrão - deixar vazio
        location = '';
        city = '';
        region = '';
        country = '';
      }

      // Criar sessão do usuário
      try {
        console.log('[AuthController] Registro - Criando sessão com:', {
          ip: finalIp,
          city: city || '(não detectada)',
          region: region || '(não detectada)',
          country: country || '(não detectada)',
        });

        const session = await UserSession.create({
          user_id: user.id,
          token_hash: tokenHash,
          ip_address: finalIp,
          user_agent: userAgent,
          device_info: deviceInfo,
          location: location || '',
          city: city || undefined,
          region: region || undefined,
          country: country || undefined,
          is_active: true,
          last_activity: new Date(),
        });
        console.log('[AuthController] Registro - Sessão criada com sucesso:', session.id);
        console.log('[AuthController] Registro - Sessão criada - IP:', session.ip_address, 'cidade:', session.city || '(não detectada)', 'região:', session.region || '(não detectada)', 'país:', session.country || '(não detectada)');
      } catch (sessionError: any) {
        // Log erro mas não falhar o registro
        console.error('[AuthController] Registro - Erro ao criar sessão:', sessionError);
        logger.error('Erro ao criar sessão de usuário no registro', { error: sessionError.message, stack: sessionError.stack });
      }

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name || null,
          username: (user as any).username || null,
          profile_picture_url: (user as any).profile_picture_url || null,
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

      // Criar hash do novo token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Obter token antigo do header para encontrar a sessão
      const oldToken = req.headers.authorization?.replace('Bearer ', '');
      const oldTokenHash = oldToken ? crypto.createHash('sha256').update(oldToken).digest('hex') : null;

      // Atualizar ou criar sessão com o novo token
      try {
        if (oldTokenHash) {
          // Tentar encontrar e atualizar sessão existente
          const existingSession = await UserSession.findOne({
            where: {
              user_id: user.id,
              token_hash: oldTokenHash,
              is_active: true,
            },
          });

          if (existingSession) {
            // Atualizar sessão existente com novo token hash
            await existingSession.update({
              token_hash: tokenHash,
              last_activity: new Date(),
            });
            console.log('[AuthController] RefreshToken - Sessão atualizada:', existingSession.id);
          } else {
            // Se não encontrou sessão, criar uma nova
            const ipAddress = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';
            const deviceInfo = parseUserAgent(userAgent);
            const finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;

            await UserSession.create({
              user_id: user.id,
              token_hash: tokenHash,
              ip_address: finalIp,
              user_agent: userAgent,
              device_info: deviceInfo,
              location: '',
              is_active: true,
              last_activity: new Date(),
            });
            console.log('[AuthController] RefreshToken - Nova sessão criada');
          }
        } else {
          // Se não há token antigo, criar nova sessão
          const ipAddress = getClientIp(req);
          const userAgent = req.headers['user-agent'] || '';
          const deviceInfo = parseUserAgent(userAgent);
          const finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;

          await UserSession.create({
            user_id: user.id,
            token_hash: tokenHash,
            ip_address: finalIp,
            user_agent: userAgent,
            device_info: deviceInfo,
            location: '',
            is_active: true,
            last_activity: new Date(),
          });
          console.log('[AuthController] RefreshToken - Nova sessão criada (sem token antigo)');
        }
      } catch (sessionError: any) {
        // Log erro mas não falhar o refresh
        console.error('[AuthController] RefreshToken - Erro ao atualizar/criar sessão:', sessionError);
        logger.error('Erro ao atualizar/criar sessão no refresh token', { error: sessionError.message, stack: sessionError.stack });
      }

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name || null,
          username: (user as any).username || null,
          profile_picture_url: (user as any).profile_picture_url || null,
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

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const { username, profile_picture_url } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      // Validar username (apenas letras, números e underscore, 3-20 caracteres)
      if (username !== undefined) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
          res.status(400).json({ error: 'Username deve ter 3-20 caracteres e conter apenas letras, números e underscore' });
          return;
        }

        // Verificar se username já existe (exceto para o próprio usuário)
        const existingUser = await User.findOne({
          where: {
            username: username.toLowerCase(),
            id: { [require('sequelize').Op.ne]: user.id },
          },
        });

        if (existingUser) {
          res.status(400).json({ error: 'Username já está em uso' });
          return;
        }
      }

      const updateData: any = {};
      if (username !== undefined) updateData.username = username.toLowerCase().trim();

      // Processar upload de foto de perfil se houver arquivo
      if ((req as any).file) {
        const { uploadToR2 } = await import('../services/r2Service');
        const storeId = user.store_id || 0; // Usar store_id se existir, senão 0
        const profilePictureUrl = await uploadToR2({
          storeId,
          category: 'profile',
          buffer: (req as any).file.buffer,
          mimeType: (req as any).file.mimetype,
          originalName: (req as any).file.originalname,
        });
        const { cleanR2Url } = await import('../services/r2Service');
        const cleanUrl = cleanR2Url(profilePictureUrl);
        updateData.profile_picture_url = cleanUrl;
      } else if (profile_picture_url !== undefined) {
        // Se veio como URL vazia ou null, remover foto
        if (profile_picture_url === '' || profile_picture_url === null) {
          updateData.profile_picture_url = null;
        } else {
          // Se veio como URL (não arquivo), usar diretamente
          updateData.profile_picture_url = profile_picture_url;
        }
      }

      await user.update(updateData);

      res.json({
        id: user.id,
        name: user.name || null,
        username: (user as any).username || null,
        email: user.email,
        role: user.role,
        store_id: user.store_id,
        profile_picture_url: (user as any).profile_picture_url || null,
      });
    } catch (error: any) {
      console.error('[AuthController] Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
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

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Email inválido' });
        return;
      }

      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
        return;
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      logger.info('Gerando token de reset:', {
        userId: user.id,
        email: user.email,
        expiresAt: resetTokenExpires.toISOString(),
        expiresInMinutes: 60
      });

      try {
        await user.update({
          reset_token: resetToken,
          reset_token_expires_at: resetTokenExpires,
        });
        logger.info('Token de reset salvo com sucesso:', {
          userId: user.id,
          expiresAt: resetTokenExpires.toISOString()
        });
      } catch (updateError: any) {
        logger.error('Erro ao atualizar token de reset', { error: updateError, userId: user.id });
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
        logger.warn('Erro ao enviar email de recuperação', { error: emailError, email: user.email });
        console.error('Erro ao enviar email de recuperação:', emailError);
      }

      res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
    } catch (error: any) {
      logger.error('Erro ao solicitar recuperação de senha', {
        error: error.message,
        stack: error.stack,
        email: req.body?.email
      });
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

      if (!user) {
        logger.warn('Token de reset não encontrado:', { token: token.substring(0, 10) + '...' });
        res.status(400).json({ error: 'Token inválido ou expirado' });
        return;
      }

      if (!user.reset_token_expires_at) {
        logger.warn('Token de reset sem data de expiração:', { userId: user.id, email: user.email });
        res.status(400).json({ error: 'Token inválido ou expirado' });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(user.reset_token_expires_at);

      if (expiresAt < now) {
        logger.warn('Token de reset expirado:', {
          userId: user.id,
          email: user.email,
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString(),
          diffMinutes: Math.round((now.getTime() - expiresAt.getTime()) / 1000 / 60)
        });
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

  /**
   * Listar sessões ativas do usuário
   */
  static async listSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      console.log('[AuthController] Listando sessões para usuário:', req.user.id);

      const token = req.headers.authorization?.replace('Bearer ', '');
      const currentTokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : null;

      // Verificar se a sessão atual existe, se não existir, criar
      if (currentTokenHash) {
        const existingSession = await UserSession.findOne({
          where: {
            user_id: req.user.id,
            token_hash: currentTokenHash,
          },
        });

        if (!existingSession) {
          // Criar sessão para o token atual
          try {
            const ipAddress = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';
            const deviceInfo = parseUserAgent(userAgent);
            const finalIp = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;

            let location = '';
            let city = '';
            let region = '';
            let country = '';
            try {
              const ipInfo = await getIPInfo(finalIp);
              if (ipInfo) {
                location = formatLocation(ipInfo);
                city = ipInfo.city || '';
                region = ipInfo.region || '';
                country = ipInfo.country || '';
              }
            } catch (locationError: any) {
              location = 'Localização desconhecida';
            }

            await UserSession.create({
              user_id: req.user.id,
              token_hash: currentTokenHash,
              ip_address: finalIp,
              user_agent: userAgent,
              device_info: deviceInfo,
              location: location,
              city: city,
              region: region,
              country: country,
              is_active: true,
              last_activity: new Date(),
            });
            console.log('[AuthController] Sessão atual criada automaticamente');
          } catch (createError: any) {
            console.error('[AuthController] Erro ao criar sessão atual:', createError);
          }
        }
      }

      const sessions = await UserSession.findAll({
        where: {
          user_id: req.user.id,
          is_active: true,
        },
        order: [['last_activity', 'DESC']],
      });

      console.log('[AuthController] Sessões encontradas:', sessions.length);

      // Marcar sessão atual e adicionar informações de cidade/país
      const sessionsWithCurrent = sessions.map((session: any) => {
        const sessionData = session.toJSON({ plain: true });

        // Usar campos diretos do banco se disponíveis, senão parsear location
        let city = sessionData.city || '';
        let region = sessionData.region || '';
        let country = sessionData.country || '';

        console.log('[AuthController] Sessão original - city:', city, 'region:', region, 'country:', country, 'location:', sessionData.location);

        // Se não tem campos separados, tentar parsear location
        if (!city && !region && !country && sessionData.location) {
          const parts = sessionData.location.split(', ').map((p: string) => p.trim()).filter((p: string) => p);

          if (parts.length >= 3) {
            city = parts[0];
            region = parts[1];
            country = parts[2];
          } else if (parts.length === 2) {
            if (parts[0] === 'Local' || parts[0] === 'Desenvolvimento') {
              region = parts[0];
              country = parts[1];
            } else {
              city = parts[0];
              country = parts[1];
            }
          } else if (parts.length === 1) {
            country = parts[0];
          }
        }

        // Não usar valores padrão - mostrar apenas o que foi detectado
        // Se não tem cidade, deixar vazio (será mostrado apenas IP)

        console.log('[AuthController] Sessão processada - city:', city, 'region:', region, 'country:', country);

        // Formatar last_activity - IMPORTANTE: PostgreSQL armazena em UTC
        // Sequelize.toJSON() retorna Date object ou string ISO
        // Vamos sempre converter para ISO string com Z explícito (UTC)
        let lastActivity = sessionData.last_activity;
        if (lastActivity) {
          if (lastActivity instanceof Date) {
            // Se é Date object, converter para ISO string (UTC)
            lastActivity = lastActivity.toISOString();
          } else if (typeof lastActivity === 'string') {
            // Se é string, garantir que tem Z (indicador UTC)
            // Se não tem timezone, adicionar Z para indicar UTC
            if (!lastActivity.includes('Z') && !lastActivity.match(/[+-]\d{2}:?\d{2}$/)) {
              // Se não tem timezone, adicionar Z para indicar UTC
              if (lastActivity.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/)) {
                lastActivity = lastActivity + 'Z';
              } else if (lastActivity.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
                lastActivity = lastActivity + '.000Z';
              } else {
                // Tentar parsear e converter
                const tempDate = new Date(lastActivity);
                if (!isNaN(tempDate.getTime())) {
                  lastActivity = tempDate.toISOString();
                } else {
                  lastActivity = lastActivity + 'Z';
                }
              }
            }
          }
        }

        return {
          ...sessionData,
          is_current: session.token_hash === currentTokenHash,
          city: city || 'Desconhecida',
          region: region || '',
          country: country || 'Desconhecido',
          last_activity: lastActivity,
        };
      });

      console.log('[AuthController] Retornando sessões:', sessionsWithCurrent.length);
      res.json(sessionsWithCurrent);
    } catch (error: any) {
      console.error('[AuthController] Erro ao listar sessões:', error);
      console.error('[AuthController] Stack:', error.stack);
      res.status(500).json({ error: 'Erro ao listar sessões', details: error.message });
    }
  }

  /**
   * Remover sessão (deslogar dispositivo)
   */
  static async removeSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const { sessionId } = req.params;
      const token = req.headers.authorization?.replace('Bearer ', '');
      const currentTokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : null;

      const session = await UserSession.findOne({
        where: {
          id: sessionId,
          user_id: req.user.id,
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Sessão não encontrada' });
        return;
      }

      // Verificar se é a sessão atual
      const isCurrentSession = session.token_hash === currentTokenHash;

      await session.update({ is_active: false });

      res.json({
        success: true,
        message: 'Sessão removida com sucesso',
        is_current: isCurrentSession,
      });
    } catch (error: any) {
      console.error('[AuthController] Erro ao remover sessão:', error);
      res.status(500).json({ error: 'Erro ao remover sessão' });
    }
  }

  /**
   * Logout - marca sessão atual como inativa
   */
  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await UserSession.update(
          { is_active: false },
          {
            where: {
              user_id: req.user.id,
              token_hash: tokenHash,
            },
          }
        );
      }

      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error: any) {
      console.error('[AuthController] Erro ao fazer logout:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  }
}


