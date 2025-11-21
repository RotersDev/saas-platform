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

  // Se a URL contém "r2_public_url=" ou "R2_PUBLIC_URL=" ou está malformada, tentar extrair a URL correta
  if (cleanUrl.includes('r2_public_url=') || cleanUrl.includes('R2_PUBLIC_URL=') || cleanUrl.includes('r2.dev')) {
    // Remover qualquer ocorrência de "r2_public_url=" ou "R2_PUBLIC_URL=" (case insensitive)
    cleanUrl = cleanUrl.replace(/[^=]*[rR]2_[pP]ublic_[uU][rR][lL]=/gi, '');
    
    // Tentar extrair URL válida (começando com http:// ou https://)
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s"']+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    } else {
      // Se não encontrar, tentar construir a URL correta
      const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
      if (r2PublicUrl && cleanUrl.includes('stores/')) {
        const pathMatch = cleanUrl.match(/stores\/[^\s"']+/);
        if (pathMatch) {
          const baseUrl = r2PublicUrl.endsWith('/') ? r2PublicUrl.slice(0, -1) : r2PublicUrl;
          cleanUrl = `${baseUrl}/${pathMatch[0]}`;
        }
      }
    }
    
    // Remover duplicações da URL base se existirem
    const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
    if (r2PublicUrl && cleanUrl.includes(r2PublicUrl)) {
      // Se a URL contém a URL base duplicada, extrair apenas a parte correta
      const index = cleanUrl.indexOf(r2PublicUrl);
      if (index > 0) {
        // Se a URL base não está no início, pegar a partir dela
        cleanUrl = cleanUrl.substring(index);
      }
      // Remover duplicações
      if (cleanUrl.includes(r2PublicUrl + r2PublicUrl)) {
        cleanUrl = cleanUrl.replace(r2PublicUrl + r2PublicUrl, r2PublicUrl);
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

