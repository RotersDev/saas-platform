import axios from 'axios';
import logger from '../config/logger';

export interface CloudflareConfig {
  apiToken: string;
  zoneId?: string;
}

export class CloudflareService {
  private static baseUrl = 'https://api.cloudflare.com/client/v4';

  /**
   * Verifica se o token do Cloudflare é válido
   */
  static async verifyToken(apiToken: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/tokens/verify`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.success === true;
    } catch (error: any) {
      logger.error('Erro ao verificar token do Cloudflare:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Busca a Zone ID de um domínio
   */
  static async getZoneId(domain: string, apiToken: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/zones`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          name: domain,
        },
      });

      if (response.data.success && response.data.result && response.data.result.length > 0) {
        return response.data.result[0].id;
      }
      return null;
    } catch (error: any) {
      logger.error('Erro ao buscar Zone ID:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Cria um registro DNS CNAME
   */
  static async createCNAME(
    zoneId: string,
    name: string,
    content: string,
    apiToken: string,
    proxied: boolean = true
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/zones/${zoneId}/dns_records`,
        {
          type: 'CNAME',
          name,
          content,
          proxied,
          ttl: 1, // Auto TTL
        },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.success === true;
    } catch (error: any) {
      logger.error('Erro ao criar registro CNAME:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Cria um registro DNS A
   */
  static async createARecord(
    zoneId: string,
    name: string,
    content: string,
    apiToken: string,
    proxied: boolean = true
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/zones/${zoneId}/dns_records`,
        {
          type: 'A',
          name,
          content,
          proxied,
          ttl: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.success === true;
    } catch (error: any) {
      logger.error('Erro ao criar registro A:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verifica se um registro DNS existe
   */
  static async recordExists(
    zoneId: string,
    name: string,
    apiToken: string
  ): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/zones/${zoneId}/dns_records`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            name,
          },
        }
      );

      return (
        response.data.success &&
        response.data.result &&
        response.data.result.length > 0
      );
    } catch (error: any) {
      logger.error('Erro ao verificar registro DNS:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Deleta um registro DNS
   */
  static async deleteRecord(
    zoneId: string,
    recordId: string,
    apiToken: string
  ): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.success === true;
    } catch (error: any) {
      logger.error('Erro ao deletar registro DNS:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verifica se um domínio aponta para nosso servidor
   */
  static async verifyDomain(domain: string): Promise<boolean> {
    try {
      const dns = await import('dns').then((m) => m.promises);
      const records = await dns.resolveCname(domain);
      // Verificar se aponta para nosso domínio base
      const baseDomain = process.env.BASE_DOMAIN || 'nerix.site';
      return records.some((record) => record.includes(baseDomain));
    } catch (error) {
      // Se não conseguir resolver, pode ser que ainda não esteja configurado
      return false;
    }
  }
}

