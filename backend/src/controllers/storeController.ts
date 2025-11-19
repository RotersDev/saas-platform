import { Response } from 'express';
import { Store, Domain, User, Theme } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { AuthRequest } from '../middleware/auth';
import { Plan } from '../models';

export class StoreController {
  static async getCurrent(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      // Buscar domínio primário se houver
      const primaryDomain = await Domain.findOne({
        where: {
          store_id: req.store.id,
          is_primary: true,
          verified: true,
        },
      });

      const storeData = req.store.toJSON();
      (storeData as any).primary_domain = primaryDomain?.domain || null;

      res.json(storeData);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar loja' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      // Verificar se usuário já tem loja
      const user = await User.findByPk(req.user.id);
      if (user?.store_id) {
        res.status(400).json({ error: 'Você já possui uma loja' });
        return;
      }

      const { name, subdomain, description, logo } = req.body;

      if (!name || !subdomain) {
        res.status(400).json({ error: 'Nome e subdomínio são obrigatórios' });
        return;
      }

      // Verificar se subdomain já existe
      const existingStore = await Store.findOne({ where: { subdomain } });
      if (existingStore) {
        res.status(400).json({ error: 'Subdomínio já existe' });
        return;
      }

      // Processar logo se houver
      let logoUrl = null;
      if ((req as any).file) {
        logoUrl = `/uploads/${(req as any).file.filename}`;
      } else if (logo) {
        logoUrl = logo;
      }

      // Buscar plano básico
      const basicPlan = await Plan.findOne({ where: { slug: 'basico' } });
      if (!basicPlan) {
        res.status(500).json({ error: 'Plano básico não encontrado' });
        return;
      }

      // Criar loja
      const store = await Store.create({
        name,
        subdomain,
        email: user.email,
        plan_id: basicPlan.id,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        logo_url: logoUrl,
        settings: {
          description: description || '',
        },
      });

      // Associar usuário à loja
      await user.update({ store_id: store.id });

      // Criar tema padrão
      await Theme.create({
        store_id: store.id,
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#007bff',
        homepage_components: {},
      });

      // Enviar email de boas-vindas
      try {
        const emailService = (await import('../services/emailService')).default;
        await emailService.sendStoreWelcome(store.name, user.email, store.subdomain);
      } catch (emailError) {
        // Não falhar se email falhar
        console.error('Erro ao enviar email de boas-vindas:', emailError);
      }

      res.status(201).json(store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      await req.store.update(req.body);

      res.json(req.store);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}


