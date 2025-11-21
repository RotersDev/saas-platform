import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import sequelize from './config/database';
import logger from './config/logger';
import { startBillingCron } from './cron/billingCron';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust proxy para capturar IP real quando atrás de proxy/load balancer
// Confiar apenas no Nginx local (127.0.0.1) para segurança
// Isso permite que o rate limiting funcione corretamente
app.set('trust proxy', 1); // Confiar apenas no primeiro proxy (Nginx)

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Nota: Uploads agora são feitos diretamente para Cloudflare R2
// Não precisamos mais servir arquivos estáticos localmente

// Rate limiting - mais permissivo em desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests em dev, 100 em produção
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Usar função customizada para obter IP real do header X-Forwarded-For
  keyGenerator: (req) => {
    // Pegar IP real do header X-Forwarded-For (primeiro IP da lista)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
      return ips || req.ip;
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    // Pular rate limiting para requisições locais em desenvolvimento
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  },
});
app.use('/api/', limiter);

// Rotas
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erro não tratado', { error: err, stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
  });
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason: any, promise) => {
  logger.error('❌ Unhandled Rejection', { reason, promise });
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('❌ Uncaught Exception', { error: error.message, stack: error.stack });
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Inicializar servidor
async function startServer() {
  try {
    logger.info('🔄 Tentando conectar ao banco de dados...');
    const dbHost = process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1');
    logger.info(`📊 Configuração: ${dbHost}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'saas_platform'}`);

    // Testar conexão com banco
    await sequelize.authenticate();
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
    }

    // Importar modelos antes de iniciar o servidor (não bloquear se falhar)
    // Usar Promise.race com timeout para evitar travamento
    try {
      logger.info('📦 Importando modelos...');
      const importPromise = import('./models/index');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao importar modelos')), 5000)
      );
      await Promise.race([importPromise, timeoutPromise]);
      logger.info('✅ Modelos importados com sucesso');
    } catch (error: any) {
      logger.warn('⚠️ Aviso ao importar modelos (continuando):', { error: error.message });
      console.warn('Aviso ao importar modelos (continuando):', error.message);
      // Continuar mesmo com erro na importação dos modelos - eles serão carregados quando necessário
    }

    logger.info('🎯 Iniciando servidor HTTP...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`🌐 Acesse: http://localhost:${PORT}`);
      logger.info(`🌐 IPv4: http://127.0.0.1:${PORT}`);

      // Iniciar cron jobs
      if (process.env.NODE_ENV === 'production') {
        startBillingCron();
      }
    });

    // Tratamento de erros do servidor
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Porta ${PORT} já está em uso`);
        console.error(`Porta ${PORT} já está em uso. Tente usar outra porta.`);
      } else {
        logger.error('❌ Erro no servidor', { error: error.message, stack: error.stack });
        console.error('Erro no servidor:', error);
      }
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('❌ Erro ao iniciar servidor', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      original: error.original?.message
    });
    console.error('❌ Erro detalhado:', error);
    process.exit(1);
  }
}

startServer();

export default app;

