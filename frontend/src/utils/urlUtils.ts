/**
 * Gera URLs limpas para a loja pública
 * Formato: /{subdomain}/... ao invés de /shop?store={subdomain}
 */
export function getShopUrl(subdomain: string | null | undefined, path: string = ''): string {
  if (!subdomain) return '/';

  // Remover barra inicial se houver
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Se não há path, retornar apenas o subdomain
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

