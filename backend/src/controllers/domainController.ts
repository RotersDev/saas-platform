import { Response } from 'express';
import { Store, Domain } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { CloudflareService } from '../services/cloudflareService';
import logger from '../config/logger';

export class DomainController {
  /**
   * Atualiza o subdomínio da loja
   */
  static async updateSubdomain(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { subdomain } = req.body;

      if (!subdomain || typeof subdomain !== 'string') {
        res.status(400).json({ error: 'Subdomínio é obrigatório' });
        return;
      }

      // Validar formato do subdomínio
      const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
      if (!subdomainRegex.test(subdomain)) {
        res.status(400).json({
          error: 'Subdomínio inválido. Use apenas letras, números e hífens. Deve ter entre 1 e 63 caracteres.',
        });
        return;
      }

      // Verificar se já existe
      const { Op } = await import('sequelize');
      const existingStore = await Store.findOne({
        where: { subdomain, id: { [Op.ne]: req.store.id } },
      });

      if (existingStore) {
        res.status(400).json({ error: 'Este subdomínio já está em uso' });
        return;
      }

      await req.store.update({ subdomain });

      res.json({
        success: true,
        message: 'Subdomínio atualizado com sucesso',
        subdomain: req.store.subdomain,
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar subdomínio:', error);
      res.status(400).json({ error: error.message || 'Erro ao atualizar subdomínio' });
    }
  }

  /**
   * Adiciona um domínio customizado
   */
  static async addDomain(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { domain, cloudflare_token, cloudflare_zone_id } = req.body;

      if (!domain || typeof domain !== 'string') {
        res.status(400).json({ error: 'Domínio é obrigatório' });
        return;
      }

      // Validar formato do domínio
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        res.status(400).json({ error: 'Formato de domínio inválido' });
        return;
      }

      // Verificar se já existe
      const existingDomain = await Domain.findOne({
        where: { domain },
      });

      if (existingDomain && existingDomain.store_id !== req.store.id) {
        res.status(400).json({ error: 'Este domínio já está em uso por outra loja' });
        return;
      }

      let zoneId = cloudflare_zone_id;

      // Se não forneceu zone_id, tentar buscar automaticamente
      if (!zoneId && cloudflare_token) {
        zoneId = await CloudflareService.getZoneId(domain, cloudflare_token);
        if (!zoneId) {
          res.status(400).json({
            error: 'Não foi possível encontrar a zona do domínio no Cloudflare. Verifique se o domínio está configurado no Cloudflare.',
          });
          return;
        }
      }

      // Verificar token do Cloudflare se fornecido
      if (cloudflare_token) {
        const isValidToken = await CloudflareService.verifyToken(cloudflare_token);
        if (!isValidToken) {
          res.status(400).json({ error: 'Token do Cloudflare inválido' });
          return;
        }
      }

      // Criar ou atualizar domínio
      const [domainRecord, created] = await Domain.findOrCreate({
        where: {
          store_id: req.store.id,
          domain,
        },
        defaults: {
          store_id: req.store.id,
          domain,
          is_primary: false,
          ssl_enabled: false,
          verified: false,
        },
      });

      if (!created) {
        await domainRecord.update({
          verified: false,
        });
      }

      // Se tem token do Cloudflare, criar registro DNS
      if (cloudflare_token && zoneId) {
        const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
        const recordName = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const subdomain = req.store.subdomain;

        // Criar CNAME apontando para o subdomínio
        const recordExists = await CloudflareService.recordExists(zoneId, recordName, cloudflare_token);

        if (!recordExists) {
          const success = await CloudflareService.createCNAME(
            zoneId,
            recordName,
            `${subdomain}.${baseDomain}`,
            cloudflare_token,
            true // Proxied através do Cloudflare
          );

          if (!success) {
            logger.warn('Não foi possível criar registro DNS automaticamente');
          }
        }
      }

      res.json({
        success: true,
        message: 'Domínio adicionado com sucesso. Configure o DNS conforme as instruções.',
        domain: domainRecord,
      });
    } catch (error: any) {
      logger.error('Erro ao adicionar domínio:', error);
      res.status(400).json({ error: error.message || 'Erro ao adicionar domínio' });
    }
  }

  /**
   * Lista domínios da loja
   */
  static async listDomains(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const domains = await Domain.findAll({
        where: { store_id: req.store.id },
        order: [['is_primary', 'DESC'], ['created_at', 'DESC']],
      });

      res.json(domains);
    } catch (error: any) {
      logger.error('Erro ao listar domínios:', error);
      res.status(500).json({ error: 'Erro ao listar domínios' });
    }
  }

  /**
   * Remove um domínio
   */
  static async removeDomain(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const domain = await Domain.findOne({
        where: { id, store_id: req.store.id },
      });

      if (!domain) {
        res.status(404).json({ error: 'Domínio não encontrado' });
        return;
      }

      await domain.destroy();

      res.json({ success: true, message: 'Domínio removido com sucesso' });
    } catch (error: any) {
      logger.error('Erro ao remover domínio:', error);
      res.status(400).json({ error: error.message || 'Erro ao remover domínio' });
    }
  }

  /**
   * Define um domínio como primário
   */
  static async setPrimary(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const domain = await Domain.findOne({
        where: { id, store_id: req.store.id },
      });

      if (!domain) {
        res.status(404).json({ error: 'Domínio não encontrado' });
        return;
      }

      if (!domain.verified) {
        res.status(400).json({ error: 'Domínio deve estar verificado antes de ser definido como primário' });
        return;
      }

      // Remover primário de outros domínios
      await Domain.update(
        { is_primary: false },
        { where: { store_id: req.store.id } }
      );

      // Definir este como primário
      await domain.update({ is_primary: true });

      // Atualizar domínio na loja
      await req.store.update({ domain: domain.domain });

      res.json({
        success: true,
        message: 'Domínio definido como primário com sucesso',
        domain,
      });
    } catch (error: any) {
      logger.error('Erro ao definir domínio primário:', error);
      res.status(400).json({ error: error.message || 'Erro ao definir domínio primário' });
    }
  }

  /**
   * Verifica se um domínio está configurado corretamente
   * Verifica REALMENTE o DNS para garantir que o CNAME aponta para o subdomain correto
   */
  static async verifyDomain(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(400).json({ error: 'Loja não encontrada' });
        return;
      }

      const { id } = req.params;

      const domain = await Domain.findOne({
        where: { id, store_id: req.store.id },
      });

      if (!domain) {
        res.status(404).json({ error: 'Domínio não encontrado' });
        return;
      }

      // Buscar a loja para obter o subdomain
      const store = await Store.findByPk(domain.store_id);
      if (!store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      // Calcular o target esperado: subdomain.nerix.online
      const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
      const expectedTarget = `${store.subdomain}.${baseDomain}`;

      logger.info(`Verificando DNS para ${domain.domain}: esperado CNAME -> ${expectedTarget}`);

      // Verificar REALMENTE o DNS
      const isVerified = await CloudflareService.verifyDomain(domain.domain, expectedTarget);

      if (isVerified) {
        await domain.update({
          verified: true,
          verified_at: new Date(),
        });
        logger.info(`✅ Domínio ${domain.domain} verificado com sucesso!`);
      } else {
        // Se não está verificado, garantir que o campo está como false
        await domain.update({
          verified: false,
        });
        logger.warn(`❌ Domínio ${domain.domain} NÃO está configurado corretamente. CNAME deve apontar para ${expectedTarget}`);
      }

      res.json({
        verified: isVerified,
        domain: domain.toJSON(),
        expectedTarget, // Retornar o target esperado para debug
      });
    } catch (error: any) {
      logger.error('Erro ao verificar domínio:', error);
      res.status(400).json({ error: error.message || 'Erro ao verificar domínio' });
    }
  }
}

