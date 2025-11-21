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

  // Remover espaços e quebras de linha
  cleanUrl = cleanUrl.replace(/\s+/g, '');

  // Se a URL contém "r2_public_url=" ou está malformada, tentar extrair a URL correta
  if (cleanUrl.includes('r2_public_url=') || cleanUrl.includes('r2.dev')) {
    // Tentar extrair URL válida
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s"']+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    } else {
      // Se não encontrar, tentar construir a URL correta
      const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
      if (r2PublicUrl && cleanUrl.includes('stores/')) {
        const pathMatch = cleanUrl.match(/stores\/[^\s"']+/);
        if (pathMatch) {
          cleanUrl = `${r2PublicUrl}/${pathMatch[0]}`;
        }
      }
    }
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

  // Se não começa com http e temos R2_PUBLIC_URL (opcional), construir URL completa
  const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
  if (r2PublicUrl && !cleanUrl.startsWith('http')) {
    // Remover barra inicial se houver
    const path = cleanUrl.startsWith('/') ? cleanUrl.substring(1) : cleanUrl;
    // Garantir que r2PublicUrl não termina com /
    const baseUrl = r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl;
    return `${baseUrl}/${path}`;
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

