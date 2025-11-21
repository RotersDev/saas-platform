/**
 * Extrai o subdomínio do hostname atual
 * Exemplo: asdad.nerix.online -> asdad
 * Exemplo: loja1.nerix.online -> loja1
 * Exemplo: nerix.online -> null (domínio principal)
 */
export function getSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // Em desenvolvimento local, não há subdomínio
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    return null;
  }

  // Pegar o domínio base da variável de ambiente ou usar padrão
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'nerix.online';

  // Se o hostname é exatamente o domínio base, não há subdomínio
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    return null;
  }

  // Verificar se o hostname termina com o domínio base
  if (hostname.endsWith(`.${baseDomain}`)) {
    // Extrair o subdomínio (tudo antes do último ponto + domínio base)
    const parts = hostname.split('.');
    const baseParts = baseDomain.split('.');

    // Remover as partes do domínio base
    const subdomainParts = parts.slice(0, parts.length - baseParts.length);

    if (subdomainParts.length > 0) {
      const subdomain = subdomainParts.join('.');
      // Ignorar 'www' como subdomínio
      if (subdomain !== 'www' && subdomain !== 'admin') {
        return subdomain;
      }
    }
  }

  // Se não encontrou subdomínio conhecido, pode ser um domínio customizado
  // Retornar null para que o backend resolva via middleware
  return null;
}

/**
 * Gera URLs limpas para a loja pública
 * Formato: /{subdomain}/... para subdomínios, ou /... para domínios customizados
 */
export function getShopUrl(subdomain: string | null | undefined, path: string = ''): string {
  // Remover barra inicial se houver
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Se não há subdomain (domínio customizado), retornar path direto
  if (!subdomain) {
    return cleanPath ? `/${cleanPath}` : '/';
  }

  // Se há subdomain, incluir no path
  if (!cleanPath) {
    return `/${subdomain}`;
  }

  return `/${subdomain}/${cleanPath}`;
}

/**
 * Gera URL para produto usando slug
 */
export function getProductUrl(subdomain: string | null | undefined, productSlug: string): string {
  return getShopUrl(subdomain, `product/${productSlug}`);
}

/**
 * Gera URL para categoria
 */
export function getCategoryUrl(subdomain: string | null | undefined, categorySlug: string): string {
  return getShopUrl(subdomain, `?category=${categorySlug}`);
}

/**
 * Gera URL para checkout
 */
export function getCheckoutUrl(subdomain: string | null | undefined): string {
  return getShopUrl(subdomain, 'checkout');
}

/**
 * Gera URL para categorias
 */
export function getCategoriesUrl(subdomain: string | null | undefined): string {
  return getShopUrl(subdomain, 'categories');
}

