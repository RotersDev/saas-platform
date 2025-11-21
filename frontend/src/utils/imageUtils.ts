/**
 * Normaliza URLs de imagens para funcionar com o proxy do Vite
 * Converte URLs absolutas do backend para URLs relativas
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Remover @ no início se houver (erro de formatação)
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('@')) {
    cleanUrl = cleanUrl.substring(1);
  }

  // Se já é uma URL relativa, retornar como está
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  // Se é uma URL absoluta do backend, converter para relativa
  if (cleanUrl.includes('localhost:3000/uploads') || cleanUrl.includes('127.0.0.1:3000/uploads')) {
    return cleanUrl.replace(/https?:\/\/[^/]+/, '');
  }

  // Se é uma URL externa (http/https), retornar como está
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  // Caso contrário, assumir que é relativa
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
}

/**
 * Normaliza um array de URLs de imagens
 */
export function normalizeImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(normalizeImageUrl).filter(Boolean);
}

