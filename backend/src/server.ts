import express from 'express';

// ❗ PRIMEIRA LINHA: Criar app ANTES de qualquer importação de middleware
const app = express();

// ❗ SEGUNDA LINHA: Configurar trust proxy IMEDIATAMENTE
// Confiar apenas no primeiro proxy (Nginx) para segurança
// Isso DEVE ser configurado ANTES de qualquer middleware ser importado
app.set('trust proxy', 1); // Confiar apenas no primeiro proxy (Nginx)

// Agora importar os middlewares
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

const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['Content-Type', 'Content-Length'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Rate limiting - trust proxy já configurado como 1 (seguro) no topo
// Usar keyGenerator customizado para garantir IP correto do X-Forwarded-For
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests em dev, 100 em produção
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Usar função customizada para obter IP real do header X-Forwarded-For
  // Isso evita a validação automática do trust proxy
  keyGenerator: (req): string => {
    // Pegar IP real do header X-Forwarded-For (primeiro IP da lista)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
      if (ips && ips.length > 0) {
        return ips;
      }
    }
    // Fallback: usar req.ip (já processado pelo trust proxy: 1)
    // Se req.ip não estiver disponível, usar socket address
    const ip = req.ip || req.socket?.remoteAddress;
    return ip && ip.length > 0 ? ip : 'unknown';
  },
  skip: (req) => {
    // Pular rate limiting para requisições locais em desenvolvimento
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  },
  // Desabilitar validação de trust proxy - já está configurado corretamente
  // @ts-ignore - validate pode não estar nos tipos, mas existe na lib
  validate: {
    trustProxy: false,
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

    // Testar conexão com banco (com timeout)
    try {
      logger.info(`🔍 Tentando conectar em: ${dbHost}:${process.env.DB_PORT || '5432'}`);
      logger.info(`🔍 Usuário: ${process.env.DB_USER || 'postgres'}`);
      logger.info(`🔍 Banco: ${process.env.DB_NAME || 'saas_platform'}`);

      const authenticatePromise = sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao conectar ao banco de dados (5s)')), 5000)
      );
      await Promise.race([authenticatePromise, timeoutPromise]);
      logger.info('✅ Conexão com banco de dados estabelecida');
    } catch (dbError: any) {
      const errorMessage = dbError.message || 'Erro desconhecido';
      const errorCode = dbError.code || 'N/A';
      const originalError = dbError.original?.message || dbError.original?.code || 'N/A';

      logger.error('❌ Erro ao conectar ao banco de dados:', {
        error: errorMessage,
        code: errorCode,
        original: originalError,
        host: dbHost,
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'saas_platform',
        user: process.env.DB_USER || 'postgres',
      });

      console.error('\n❌ ============================================');
      console.error('❌ ERRO AO CONECTAR AO BANCO DE DADOS');
      console.error('❌ ============================================');
      console.error(`Mensagem: ${errorMessage}`);
      console.error(`Código: ${errorCode}`);
      console.error(`Original: ${originalError}`);
      console.error(`Host: ${dbHost}:${process.env.DB_PORT || '5432'}`);
      console.error(`Banco: ${process.env.DB_NAME || 'saas_platform'}`);
      console.error(`Usuário: ${process.env.DB_USER || 'postgres'}`);
      console.error('\n💡 Possíveis soluções:');
      console.error('   1. Verifique se o container está rodando: docker ps');
      console.error('   2. Verifique se o banco existe: docker exec saas_postgres psql -U postgres -l');
      console.error('   3. Crie o banco se não existir: docker exec saas_postgres psql -U postgres -c "CREATE DATABASE saas_platform;"');
      console.error('   4. Verifique as credenciais no arquivo .env');
      console.error('❌ ============================================\n');

      process.exit(1);
    }

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
    }

    // Criar tabelas se não existirem (não bloquear se falhar)
    const tablesToCreate = [
      {
        name: 'templates',
        createQuery: `
          CREATE TABLE templates (
            id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            is_default BOOLEAN NOT NULL DEFAULT false,
            is_active BOOLEAN NOT NULL DEFAULT false,
            custom_css TEXT,
            custom_js TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `,
        indexes: [
          `CREATE INDEX templates_store_id_idx ON templates(store_id);`,
          `CREATE INDEX templates_store_id_is_active_idx ON templates(store_id, is_active);`,
        ],
      },
      {
        name: 'domains',
        createQuery: `
          CREATE TABLE domains (
            id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL,
            domain VARCHAR(255) NOT NULL UNIQUE,
            is_primary BOOLEAN NOT NULL DEFAULT false,
            ssl_enabled BOOLEAN NOT NULL DEFAULT false,
            ssl_certificate TEXT,
            ssl_key TEXT,
            verified BOOLEAN NOT NULL DEFAULT false,
            verified_at TIMESTAMP,
            verify_token VARCHAR(255),
            verify_token_expires TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `,
        indexes: [
          `CREATE INDEX domains_store_id_idx ON domains(store_id);`,
          `CREATE INDEX domains_domain_idx ON domains(domain);`,
        ],
      },
    ];

    for (const table of tablesToCreate) {
      try {
        const [results] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = '${table.name}'
          );
        `);
        const tableExists = (results as any[])[0]?.exists;

        if (!tableExists) {
          logger.info(`🔄 Criando tabela ${table.name}...`);
          try {
            await sequelize.query(table.createQuery);
            for (const indexQuery of table.indexes) {
              try {
                await sequelize.query(indexQuery);
              } catch (indexError: any) {
                if (!indexError.message?.includes('already exists')) {
                  logger.warn(`⚠️ Aviso ao criar índice para ${table.name}:`, indexError.message);
                }
              }
            }
            logger.info(`✅ Tabela ${table.name} criada com sucesso!`);
          } catch (createError: any) {
            if (createError.message && createError.message.includes('already exists')) {
              logger.info(`ℹ️ Tabela ${table.name} já existe.`);
            } else {
              logger.warn(`⚠️ Aviso ao criar tabela ${table.name}:`, createError.message);
            }
          }
        } else {
          logger.info(`ℹ️ Tabela ${table.name} já existe. Verificando colunas...`);

          // Verificar e criar colunas faltantes (especialmente para domains)
          if (table.name === 'domains') {
            try {
              const [columns] = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'domains';
              `);
              const existingColumns = (columns as any[]).map((c: any) => c.column_name);

              if (!existingColumns.includes('verify_token')) {
                logger.info(`🔄 Adicionando coluna verify_token à tabela domains...`);
                await sequelize.query(`ALTER TABLE domains ADD COLUMN verify_token VARCHAR(255);`);
                logger.info(`✅ Coluna verify_token adicionada!`);
              }

              if (!existingColumns.includes('verify_token_expires')) {
                logger.info(`🔄 Adicionando coluna verify_token_expires à tabela domains...`);
                await sequelize.query(`ALTER TABLE domains ADD COLUMN verify_token_expires TIMESTAMP;`);
                logger.info(`✅ Coluna verify_token_expires adicionada!`);
              }
            } catch (columnError: any) {
              logger.warn(`⚠️ Aviso ao verificar colunas de ${table.name}:`, columnError.message);
            }
          }

          // Verificar índices faltantes
          for (const indexQuery of table.indexes) {
            try {
              await sequelize.query(indexQuery);
            } catch (indexError: any) {
              if (!indexError.message?.includes('already exists')) {
                // Ignorar se o índice já existe
              }
            }
          }
        }
      } catch (error: any) {
        logger.warn(`⚠️ Aviso ao verificar tabela ${table.name} (continuando):`, error.message);
      }
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

