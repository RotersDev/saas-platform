import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import mime from "mime-types";
import sharp from "sharp";

// Cliente R2 configurado (lazy initialization para evitar erros se variáveis não estiverem definidas)
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Credenciais do Cloudflare R2 não configuradas. Verifique as variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env');
    }

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
}

export interface UploadOptions {
  storeId: number;
  category: 'products' | 'logos' | 'favicons' | 'banners' | 'profile' | 'categories';
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
}

/**
 * Faz upload de um arquivo para o R2
 * Converte imagens para WEBP automaticamente
 * @returns URL pública do arquivo
 */
export async function uploadToR2(options: UploadOptions): Promise<string> {
  const { storeId, category, buffer, mimeType } = options;

  // Validar variáveis de ambiente
  const bucket = process.env.R2_BUCKET;
  let publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2_BUCKET ou R2_PUBLIC_URL não configurados no .env');
  }

  // Limpar a URL pública imediatamente para evitar problemas
  publicUrl = publicUrl.trim();
  // Remover @ do início se houver
  if (publicUrl.startsWith('@')) publicUrl = publicUrl.substring(1);
  // Remover "r2_public_url=" se estiver no início (caso tenha sido salvo incorretamente)
  publicUrl = publicUrl.replace(/^r2_public_url=/i, '');
  // Garantir que começa com http:// ou https://
  if (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
    publicUrl = `https://${publicUrl}`;
  }
  // Remover barra final
  publicUrl = publicUrl.replace(/\/+$/, '');

  let finalBuffer = buffer;
  let finalMimeType = mimeType;
  let fileExtension = 'webp';

  // Converter imagens para WEBP
  if (mimeType.startsWith('image/')) {
    try {
      // Converter para WEBP com qualidade 85%
      finalBuffer = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();
      finalMimeType = 'image/webp';
      fileExtension = 'webp';
    } catch (error) {
      // Se falhar a conversão, usar o buffer original
      console.warn('[R2Service] Erro ao converter imagem para WEBP, usando original:', error);
      fileExtension = mime.extension(mimeType) || 'png';
    }
  } else {
    // Para arquivos não-imagem, manter extensão original
    fileExtension = mime.extension(mimeType) || 'bin';
  }

  // Gerar nome único do arquivo
  const fileName = `${uuid()}.${fileExtension}`;

  // Caminho no bucket: stores/{store_id}/{category}/{filename}
  const key = `stores/${storeId}/${category}/${fileName}`;

  // Fazer upload
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: finalBuffer,
    ContentType: finalMimeType,
  });

  try {
    const client = getR2Client();
    await client.send(command);

    // Garantir que key não começa com /
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    // Construir URL final (publicUrl já foi limpo acima)
    const url = `${publicUrl}/${cleanKey}`;
    // Limpar a URL final antes de retornar (para garantir que não há problemas)
    const finalUrl = cleanR2Url(url);
    console.log('[R2Service] Upload concluído com sucesso:', finalUrl);
    return finalUrl;
  } catch (error: any) {
    console.error('[R2Service] Erro ao fazer upload para R2:', error);
    console.error('[R2Service] Detalhes do erro:', {
      message: error.message,
      name: error.name,
      code: error.code,
      $metadata: error.$metadata,
    });
    throw new Error(`Erro ao fazer upload para R2: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Deleta um arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error('R2_BUCKET não configurado no .env');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const client = getR2Client();
  await client.send(command);
}

/**
 * Limpa uma URL do R2 removendo prefixos indesejados e garantindo formato correto
 */
export function cleanR2Url(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  let cleanUrl = url.trim();
  
  // Remover @ do início
  if (cleanUrl.startsWith('@')) cleanUrl = cleanUrl.substring(1);
  
  // Remover qualquer ocorrência de "r2_public_url=" ou "R2_PUBLIC_URL=" (case insensitive)
  cleanUrl = cleanUrl.replace(/[^=]*[rR]2_[pP]ublic_[uU][rR][lL]=/gi, '');
  
  // Remover espaços
  cleanUrl = cleanUrl.replace(/\s+/g, '');
  
  // Se a URL contém "r2.dev" mas não começa com http, pode estar malformada
  if (cleanUrl.includes('r2.dev') && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // Tentar extrair a URL válida usando regex
    const urlMatch = cleanUrl.match(/https?:\/\/[^\s"']+/);
    if (urlMatch) {
      cleanUrl = urlMatch[0];
    } else {
      // Se não encontrar, tentar construir a partir do path
      const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^@+/, '').replace(/\/+$/, '') || '';
      if (r2PublicUrl && cleanUrl.includes('stores/')) {
        const pathMatch = cleanUrl.match(/stores\/[^\s"']+/);
        if (pathMatch) {
          cleanUrl = `${r2PublicUrl}/${pathMatch[0]}`;
        }
      }
    }
  }
  
  // Garantir que começa com http:// ou https://
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^@+/, '').replace(/\/+$/, '') || '';
    if (r2PublicUrl && cleanUrl.includes('stores/')) {
      const pathMatch = cleanUrl.match(/stores\/[^\s"']+/);
      if (pathMatch) {
        cleanUrl = `${r2PublicUrl}/${pathMatch[0]}`;
      } else {
        cleanUrl = `${r2PublicUrl}/${cleanUrl}`;
      }
    }
  }
  
  // Remover qualquer duplicação da URL base
  const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^@+/, '').replace(/\/+$/, '') || '';
  if (r2PublicUrl && cleanUrl.includes(r2PublicUrl)) {
    // Se a URL contém a URL base duplicada, extrair apenas a parte correta
    const index = cleanUrl.indexOf(r2PublicUrl);
    if (index > 0) {
      // Se a URL base não está no início, pegar a partir dela
      cleanUrl = cleanUrl.substring(index);
    }
    // Remover duplicações da URL base
    cleanUrl = cleanUrl.replace(new RegExp(r2PublicUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), r2PublicUrl);
    // Se ainda tiver duplicação, pegar apenas a primeira ocorrência
    if (cleanUrl.includes(r2PublicUrl + r2PublicUrl)) {
      cleanUrl = cleanUrl.replace(r2PublicUrl + r2PublicUrl, r2PublicUrl);
    }
  }
  
  return cleanUrl;
}

/**
 * Extrai a chave (key) de uma URL do R2
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url || !url.includes(process.env.R2_PUBLIC_URL || '')) {
    return null;
  }

  const publicUrl = process.env.R2_PUBLIC_URL || '';
  return url.replace(publicUrl + '/', '');
}

