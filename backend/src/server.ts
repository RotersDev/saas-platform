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

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length'],
}));

// Headers para permitir acesso a imagens
app.use('/uploads', (_req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
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

// Inicializar servidor
async function startServer() {
  try {
    logger.info('🔄 Tentando conectar ao banco de dados...');
    logger.info(`📊 Configuração: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'saas_platform'}`);

    // Testar conexão com banco
    await sequelize.authenticate();
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`🌐 Acesse: http://localhost:${PORT}`);

      // Iniciar cron jobs
      if (process.env.NODE_ENV === 'production') {
        startBillingCron();
      }
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

