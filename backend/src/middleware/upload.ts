import multer from 'multer';

// Usar memoryStorage para manter arquivos em buffer (não salvar no disco)
// Os arquivos serão enviados diretamente para o Cloudflare R2
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas'));
  }
};

// Upload single file (para logo, favicon, etc)
export const upload = multer({
  storage: multer.memoryStorage(), // Mantém em buffer para enviar ao R2
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

// Upload de múltiplas imagens (para produtos)
export const uploadMultiple = multer({
  storage: multer.memoryStorage(), // Mantém em buffer para enviar ao R2
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por arquivo
    files: 10, // Máximo 10 imagens
  },
});

