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
   * Verifica o registro TXT para verificação de domínio
   * @param domain - Domínio do cliente (ex: rsxdenuncias.site)
   * @param expectedToken - Token esperado no TXT record
   * @returns true se o TXT record contém o token esperado
   */
  static async verifyDomainTxt(domain: string, expectedToken: string): Promise<boolean> {
    const txtRecordName = `_cf-custom-hostname.${domain}`;

    try {
      const dns = await import('dns').then((m) => m.promises);

      logger.info(`🔍 Verificando TXT record para ${txtRecordName}...`);

      // Resolver TXT record
      const records = await dns.resolveTxt(txtRecordName);

      // TXT records retornam arrays de strings, então precisamos "achatar" o array
      const txtValues = records.flat();

      logger.info(`📋 Registros TXT encontrados para ${txtRecordName}:`, txtValues);

      // Verificar se algum registro TXT contém o token esperado
      const isValid = txtValues.some((record) => {
        const cleanRecord = record.trim();
        const matches = cleanRecord === expectedToken;

        if (matches) {
          logger.info(`✅ TXT record encontrado e correto: ${cleanRecord} === ${expectedToken}`);
        } else {
          logger.warn(`❌ TXT record não corresponde: ${cleanRecord} !== ${expectedToken}`);
        }

        return matches;
      });

      if (isValid) {
        logger.info(`✅ Domínio ${domain} TXT record verificado! Token encontrado.`);
      } else {
        logger.warn(`❌ Domínio ${domain} TXT record NÃO verificado. Esperado: ${expectedToken}, Encontrado: ${txtValues.join(', ')}`);
      }

      return isValid;
    } catch (error: any) {
      // Se não conseguir resolver, pode ser que ainda não esteja configurado ou DNS não propagou
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        logger.warn(`❌ TXT record ${txtRecordName} não encontrado. Erro: ${error.code}`);
      } else {
        logger.error(`❌ Erro ao verificar TXT record para ${domain}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Verifica o registro CNAME do domínio
   * @param domain - Domínio do cliente (ex: rsxdenuncias.site)
   * @param expectedTarget - Target esperado do CNAME (ex: host.nerix.online)
   * @returns true se o CNAME está configurado corretamente
   */
  static async verifyDomainCname(domain: string, expectedTarget: string): Promise<boolean> {
    try {
      const dns = await import('dns').then((m) => m.promises);

      logger.info(`🔍 Verificando CNAME para ${domain}...`);
      logger.info(`🔍 Target esperado: ${expectedTarget}`);

      // Tentar resolver CNAME primeiro
      let cnameRecords: string[] = [];
      try {
        cnameRecords = await dns.resolveCname(domain);
        logger.info(`📋 Registros CNAME encontrados para ${domain}:`, JSON.stringify(cnameRecords, null, 2));
      } catch (cnameError: any) {
        // Se não tem CNAME, pode ser que esteja com proxy do Cloudflare (retorna A record)
        logger.info(`ℹ️ Não foi possível resolver CNAME diretamente para ${domain}. Tentando outras formas...`);
        logger.info(`ℹ️ Erro CNAME: ${cnameError.code} - ${cnameError.message}`);
      }

      // Se encontrou CNAME, verificar
      if (cnameRecords.length > 0) {
        const isValid = cnameRecords.some((record) => {
          // Remover ponto final se houver (DNS pode retornar com ponto final)
          const cleanRecord = record.replace(/\.$/, '').trim().toLowerCase();
          const cleanExpected = expectedTarget.trim().toLowerCase();

          logger.info(`🔍 Comparando: "${cleanRecord}" === "${cleanExpected}"`);

          // Verificar se o registro é exatamente igual ao esperado
          const matches = cleanRecord === cleanExpected;

          if (matches) {
            logger.info(`✅ CNAME encontrado e correto: ${cleanRecord} === ${cleanExpected}`);
          } else {
            logger.warn(`❌ CNAME não corresponde: "${cleanRecord}" !== "${cleanExpected}"`);
          }

          return matches;
        });

        if (isValid) {
          logger.info(`✅ Domínio ${domain} CNAME verificado! Aponta para ${expectedTarget}`);
          return true;
        }
      }

      // Se não encontrou CNAME ou não bateu, tentar resolver ANY para ver todos os registros
      try {
        logger.info(`🔍 Tentando resolver ANY para ${domain}...`);
        const anyRecords = await dns.resolveAny(domain);
        logger.info(`📋 Registros ANY encontrados para ${domain}:`, JSON.stringify(anyRecords, null, 2));

        // Procurar por CNAME nos registros ANY
        for (const record of anyRecords) {
          if (record.type === 'CNAME' && 'value' in record) {
            const cnameValue = (record as any).value;
            const cleanRecord = cnameValue.replace(/\.$/, '').trim().toLowerCase();
            const cleanExpected = expectedTarget.trim().toLowerCase();

            logger.info(`🔍 Comparando CNAME de ANY: "${cleanRecord}" === "${cleanExpected}"`);

            if (cleanRecord === cleanExpected) {
              logger.info(`✅ CNAME encontrado via ANY e correto: ${cleanRecord} === ${cleanExpected}`);
              return true;
            }
          }
        }
      } catch (anyError: any) {
        logger.warn(`ℹ️ Não foi possível resolver ANY para ${domain}: ${anyError.code} - ${anyError.message}`);
      }

      // Última tentativa: verificar se o domínio resolve para o mesmo destino que o expectedTarget
      // Isso pode funcionar quando o Cloudflare tem proxy ativado
      try {
        logger.info(`🔍 Tentando verificar via resolução do destino...`);

        // Resolver o expectedTarget para ver para onde ele aponta
        let expectedTargetRecords: string[] = [];
        try {
          expectedTargetRecords = await dns.resolveCname(expectedTarget);
          logger.info(`📋 Registros CNAME do target ${expectedTarget}:`, JSON.stringify(expectedTargetRecords, null, 2));
        } catch (e) {
          // Se não tem CNAME, pode ter A record
          try {
            const aRecords = await dns.resolve4(expectedTarget);
            expectedTargetRecords = aRecords;
            logger.info(`📋 Registros A do target ${expectedTarget}:`, JSON.stringify(aRecords, null, 2));
          } catch (e2) {
            logger.warn(`ℹ️ Não foi possível resolver ${expectedTarget}`);
          }
        }

        // Resolver o domínio do cliente
        let domainRecords: string[] = [];
        try {
          domainRecords = await dns.resolve4(domain);
          logger.info(`📋 Registros A do domínio ${domain}:`, JSON.stringify(domainRecords, null, 2));
        } catch (e) {
          logger.warn(`ℹ️ Não foi possível resolver A record para ${domain}`);
        }

        // Se ambos resolveram para os mesmos IPs, provavelmente está correto
        if (expectedTargetRecords.length > 0 && domainRecords.length > 0) {
          const hasCommonIP = expectedTargetRecords.some(ip => domainRecords.includes(ip));
          if (hasCommonIP) {
            logger.info(`✅ Domínio ${domain} resolve para os mesmos IPs que ${expectedTarget} - CNAME provavelmente está correto (proxy ativado)`);
            return true;
          }
        }
      } catch (finalError: any) {
        logger.warn(`ℹ️ Erro na verificação final: ${finalError.message}`);
      }

      // Se chegou aqui, não encontrou CNAME correto
      logger.warn(`❌ Domínio ${domain} CNAME NÃO verificado. Esperado: ${expectedTarget}, CNAME encontrados: ${cnameRecords.join(', ') || 'nenhum'}`);
      return false;
    } catch (error: any) {
      // Se não conseguir resolver, pode ser que ainda não esteja configurado ou DNS não propagou
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        logger.warn(`❌ Domínio ${domain} não possui registro CNAME ou não foi encontrado. Erro: ${error.code}`);
      } else {
        logger.error(`❌ Erro ao verificar CNAME para ${domain}:`, error.message);
        logger.error(`❌ Stack trace:`, error.stack);
      }
      return false;
    }
  }
}

