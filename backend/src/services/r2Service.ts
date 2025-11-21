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
  const { storeId, category, buffer, mimeType, originalName } = options;

  // Validar variáveis de ambiente
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2_BUCKET ou R2_PUBLIC_URL não configurados no .env');
  }

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

    // Retornar URL pública (garantir que não tenha @ no início e remover espaços)
    const cleanPublicUrl = publicUrl.trim().replace(/^@+/, ''); // Remove @ do início e espaços
    const url = `${cleanPublicUrl}/${key}`;
    console.log('[R2Service] Upload concluído com sucesso:', url);
    return url;
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
 * Extrai a chave (key) de uma URL do R2
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url || !url.includes(process.env.R2_PUBLIC_URL || '')) {
    return null;
  }

  const publicUrl = process.env.R2_PUBLIC_URL || '';
  return url.replace(publicUrl + '/', '');
}

