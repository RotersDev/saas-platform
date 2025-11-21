import axios from 'axios';

export interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  isp?: string;
  org?: string;
}

/**
 * Buscar informações de IP usando ipapi.co (gratuita, até 1000 req/dia)
 * Fallback para ip-api.com se falhar
 */
export async function getIPInfo(ip: string): Promise<IPInfo | null> {
  try {
    // Para IPs locais, não retornar cidade (retornar apenas IP)
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      // Não retornar cidade para IPs locais - apenas o IP
      return {
        ip,
        city: undefined,
        region: undefined,
        country: undefined,
        countryCode: undefined,
        timezone: undefined,
      };
    }

    // Tentar ipapi.co primeiro (melhor para cidade)
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.data && !response.data.error && response.data.city) {
        console.log('[IPInfoService] ipapi.co retornou:', response.data.city, response.data.country_name);
        return {
          ip: response.data.ip || ip,
          city: response.data.city || '',
          region: response.data.region || response.data.region_code || '',
          country: response.data.country_name || '',
          countryCode: response.data.country_code || '',
          timezone: response.data.timezone || 'America/Sao_Paulo',
          isp: response.data.org || '',
          org: response.data.org || '',
        };
      }
    } catch (ipapiError: any) {
      console.log('[IPInfoService] ipapi.co falhou, tentando ip-api.com:', ipapiError.message);
    }

    // Tentar ipinfo.io como segunda opção
    try {
      const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.data && response.data.city) {
        console.log('[IPInfoService] ipinfo.io retornou:', response.data.city, response.data.country);
        const [city, region] = (response.data.city || '').split(',');
        return {
          ip: response.data.ip || ip,
          city: city?.trim() || '',
          region: response.data.region || region?.trim() || '',
          country: response.data.country || '',
          countryCode: response.data.country || '',
          timezone: response.data.timezone || 'America/Sao_Paulo',
          isp: response.data.org || '',
          org: response.data.org || '',
        };
      }
    } catch (ipinfoError: any) {
      console.log('[IPInfoService] ipinfo.io falhou, tentando ip-api.com:', ipinfoError.message);
    }

    // Fallback para ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000,
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,timezone,isp,org,query',
      },
    });

    if (response.data.status === 'success' && response.data.city) {
      console.log('[IPInfoService] ip-api.com retornou:', response.data.city, response.data.country);
      return {
        ip: response.data.query || ip,
        city: response.data.city || '',
        region: response.data.regionName || response.data.region || '',
        country: response.data.country || '',
        countryCode: response.data.countryCode || '',
        timezone: response.data.timezone || 'America/Sao_Paulo',
        isp: response.data.isp || '',
        org: response.data.org || '',
      };
    }

    // Se nenhuma API funcionou, retornar apenas o IP (sem cidade)
    return {
      ip,
      city: undefined,
      region: undefined,
      country: undefined,
    };
  } catch (error: any) {
    console.error('[IPInfoService] Erro ao buscar informações de IP:', error.message);
    // Em caso de erro, retornar apenas o IP (sem cidade)
    return {
      ip,
      city: undefined,
      region: undefined,
      country: undefined,
    };
  }
}

/**
 * Formatar localização para exibição (cidade, país)
 */
export function formatLocation(ipInfo: IPInfo | null): string {
  if (!ipInfo) return 'Localização desconhecida';

  const parts: string[] = [];
  // Sempre incluir cidade se existir (não filtrar "Local" aqui, deixar o frontend decidir)
  if (ipInfo.city && ipInfo.city.trim()) {
    parts.push(ipInfo.city);
  }
  if (ipInfo.country && ipInfo.country.trim()) {
    parts.push(ipInfo.country);
  }

  return parts.length > 0 ? parts.join(', ') : 'Localização desconhecida';
}

/**
 * Obter cidade e país separadamente
 */
export function getCityAndCountry(ipInfo: IPInfo | null): { city: string; country: string } {
  if (!ipInfo) {
    return { city: 'Desconhecida', country: 'Desconhecido' };
  }

  return {
    city: ipInfo.city || 'Desconhecida',
    country: ipInfo.country || 'Desconhecido',
  };
}

