/**
 * Normaliza URLs de imagens para funcionar com o proxy do Vite
 * Converte URLs absolutas do backend para URLs relativas
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Se já é uma URL relativa, retornar como está
  if (url.startsWith('/')) {
    return url;
  }

  // Se é uma URL absoluta do backend, converter para relativa
  if (url.includes('localhost:3000/uploads') || url.includes('127.0.0.1:3000/uploads')) {
    return url.replace(/https?:\/\/[^/]+/, '');
  }

  // Se é uma URL externa (http/https), retornar como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Caso contrário, assumir que é relativa
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Normaliza um array de URLs de imagens
 */
export function normalizeImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(normalizeImageUrl).filter(Boolean);
}

