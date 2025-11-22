/**
 * Extrai o subdomínio do hostname atual ou do path (para localhost)
 * Exemplo: asdad.nerix.online -> asdad
 * Exemplo: loja1.nerix.online -> loja1
 * Exemplo: localhost:5173/asdadaadas -> asdadaadas (do path)
 * Exemplo: nerix.online -> null (domínio principal)
 */
export function getSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Em desenvolvimento local, tentar extrair do path
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    // Extrair primeira parte do path como subdomínio
    const pathParts = pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    // Rotas conhecidas que NÃO são subdomínios
    const knownRoutes = ['admin', 'store', 'login', 'register', 'create-store', 'product', 'checkout', 'payment', 'order', 'categories', 'terms', 'my-orders', 'forgot-password', 'reset-password', 'api'];

    // Se a primeira parte do path não é uma rota conhecida e não está vazia, é provavelmente um subdomínio
    if (firstPart && !knownRoutes.includes(firstPart) && firstPart.length > 0) {
      // Validar formato básico (letras, números, hífens)
      if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(firstPart)) {
        return firstPart;
      }
    }

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
 * Quando já estamos em um subdomain (ex: musuca02.nerix.online), não inclui o subdomain no path
 * Formato: /product/slug (quando em subdomain) ou /... (domínio customizado)
 * @param subdomain - Subdomain da loja (null para domínio customizado)
 * @param path - Caminho dentro da loja (vazio para raiz)
 * @param forceRoot - Se true, sempre retorna raiz sem subdomain no path (útil para logo/header)
 */
export function getShopUrl(subdomain: string | null | undefined, path: string = '', forceRoot: boolean = false): string {
  // Remover barra inicial se houver
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Se forceRoot é true, sempre retornar raiz (sem subdomain no path)
  // Isso é útil para o logo/header que deve sempre ir para a página principal
  if (forceRoot && !cleanPath) {
    return '/';
  }

  // Verificar se já estamos em um subdomain no hostname
  // Se sim, não incluir subdomain no path (URLs limpas como /product/slug)
  const currentSubdomain = getSubdomainFromHostname();
  const isInSubdomain = currentSubdomain && currentSubdomain === subdomain;

  // Se não há subdomain (domínio customizado) ou já estamos em subdomain, retornar path direto
  // Isso gera URLs limpas como /product/maria-1 em vez de /musuca02/product/maria-1
  if (!subdomain || isInSubdomain) {
    return cleanPath ? `/${cleanPath}` : '/';
  }

  // Se há subdomain mas não estamos nele (ex: link de outra página), incluir no path
  // Mas isso não deve acontecer normalmente, então retornar path direto
  return cleanPath ? `/${cleanPath}` : '/';
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

/**
 * Gera URL para login do cliente
 */
export function getLoginUrl(subdomain: string | null | undefined): string {
  return getShopUrl(subdomain, 'login');
}

/**
 * Gera URL para recuperação de senha do cliente
 */
export function getForgotPasswordUrl(subdomain: string | null | undefined): string {
  return getShopUrl(subdomain, 'forgot-password');
}

