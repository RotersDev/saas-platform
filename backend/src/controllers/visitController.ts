import { Response } from 'express';
import { Visit } from '../models';
import { TenantRequest } from '../middleware/tenant';
import { Op } from 'sequelize';

export class VisitController {
  static async trackVisit(req: TenantRequest, res: Response): Promise<void> {
    try {
      // Log para debug
      console.log('[VisitController.trackVisit] Host:', req.headers.host, '| Store:', req.store ? `${req.store.name} (ID: ${req.store.id})` : 'Não encontrada');

      if (!req.store) {
        // Se não encontrar a loja, retornar sucesso silenciosamente (não quebrar o frontend)
        console.log('[VisitController.trackVisit] Loja não encontrada, retornando sucesso silencioso');
        res.status(200).json({ success: true, message: 'Loja não encontrada, visita não registrada' });
        return;
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || '';
      const refererRaw = req.headers.referer || req.headers.referrer || '';
      const referer = Array.isArray(refererRaw) ? refererRaw[0] : refererRaw;
      // Aceitar path de query params ou body
      const path = (req.query.path as string) || (req.body?.page_url as string) || req.originalUrl || '/';

      // Validar path (limitar tamanho)
      const cleanPath = path.length > 500 ? path.substring(0, 500) : path;

      try {
        await Visit.create({
          store_id: req.store.id,
          ip_address: Array.isArray(ipAddress) ? ipAddress[0] : (ipAddress || 'unknown'),
          user_agent: userAgent,
          referer: referer,
          path: cleanPath,
        });
        console.log('[VisitController.trackVisit] ✅ Visita registrada com sucesso');
        res.json({ success: true });
      } catch (dbError: any) {
        // Se for erro de tabela não existir, retornar sucesso silenciosamente
        if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
          console.warn('[VisitController.trackVisit] Tabela visits não existe, retornando sucesso silencioso');
          res.status(200).json({ success: true, message: 'Tabela de visitas não configurada' });
          return;
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error('[VisitController] Error tracking visit:', error);
      // Retornar sucesso mesmo em caso de erro para não quebrar o frontend
      res.status(200).json({ success: false, error: 'Erro ao registrar visita' });
    }
  }

  static async getVisits(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { start, end } = req.query;

      const where: any = { store_id: req.store.id };

      if (start && end) {
        where.created_at = {
          [Op.gte]: new Date(start as string),
          [Op.lte]: new Date(end as string),
        };
      }

      const visits = await Visit.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: 1000,
      });

      res.json({ visits, count: visits.length });
    } catch (error: any) {
      console.error('[VisitController] Error getting visits:', error);
      res.status(500).json({ error: 'Erro ao buscar visitas' });
    }
  }

  static async getVisitStats(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.store) {
        res.status(404).json({ error: 'Loja não encontrada' });
        return;
      }

      const { start, end } = req.query;

      const where: any = { store_id: req.store.id };

      if (start && end) {
        where.created_at = {
          [Op.gte]: new Date(start as string),
          [Op.lte]: new Date(end as string),
        };
      }

      const totalVisits = await Visit.count({ where });

      // Visitas únicas por IP - usar distinct
      const allVisits = await Visit.findAll({
        where,
        attributes: ['ip_address'],
        raw: true,
      });

      // Obter IPs únicos
      const uniqueIPs = new Set(allVisits.map(v => v.ip_address).filter(Boolean));
      const uniqueVisitsCount = uniqueIPs.size;

      res.json({
        totalVisits,
        uniqueVisits: uniqueVisitsCount,
      });
    } catch (error: any) {
      console.error('[VisitController] Error getting visit stats:', error);
      // Se a tabela não existir, retornar valores padrão (0) em vez de erro 500
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        res.json({
          totalVisits: 0,
          uniqueVisits: 0,
        });
        return;
      }
      res.status(500).json({ error: 'Erro ao buscar estatísticas de visitas' });
    }
  }
}

