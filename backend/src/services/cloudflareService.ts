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
  /**
   * Verifica REALMENTE se o domínio está configurado corretamente
   * @param domain - Domínio do cliente (ex: rsxdenuncias.site)
   * @param expectedTarget - Target esperado do CNAME (ex: soumelhor.nerix.online)
   * @returns true se o CNAME está configurado corretamente
   */
  static async verifyDomain(domain: string, expectedTarget: string): Promise<boolean> {
    try {
      const dns = await import('dns').then((m) => m.promises);
      
      logger.info(`🔍 Verificando DNS para ${domain}...`);
      
      // Resolver CNAME do domínio
      const records = await dns.resolveCname(domain);
      
      logger.info(`📋 Registros CNAME encontrados para ${domain}:`, records);
      
      // Verificar se algum registro CNAME aponta exatamente para o target esperado
      const isValid = records.some((record) => {
        // Remover ponto final se houver (DNS pode retornar com ponto final)
        const cleanRecord = record.replace(/\.$/, '').toLowerCase();
        const cleanExpected = expectedTarget.toLowerCase();
        
        // Verificar se o registro é exatamente igual ao esperado
        const matches = cleanRecord === cleanExpected;
        
        if (matches) {
          logger.info(`✅ CNAME encontrado e correto: ${cleanRecord} === ${cleanExpected}`);
        } else {
          logger.warn(`❌ CNAME não corresponde: ${cleanRecord} !== ${cleanExpected}`);
        }
        
        return matches;
      });

      if (isValid) {
        logger.info(`✅ Domínio ${domain} está configurado corretamente! CNAME aponta para ${expectedTarget}`);
      } else {
        logger.warn(`❌ Domínio ${domain} NÃO está configurado corretamente. Esperado: ${expectedTarget}, Encontrado: ${records.join(', ')}`);
      }

      return isValid;
    } catch (error: any) {
      // Se não conseguir resolver, pode ser que ainda não esteja configurado ou DNS não propagou
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        logger.warn(`❌ Domínio ${domain} não possui registro CNAME ou não foi encontrado. Erro: ${error.code}`);
      } else {
        logger.error(`❌ Erro ao verificar DNS para ${domain}:`, error.message);
      }
      return false;
    }
  }
}

