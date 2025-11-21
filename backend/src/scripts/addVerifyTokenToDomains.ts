import sequelize from '../config/database';
import logger from '../config/logger';

async function addVerifyTokenToDomains() {
  try {
    logger.info('🔄 Adicionando campos verify_token e verify_token_expires à tabela domains...');

    await sequelize.authenticate();
    logger.info('✅ Conexão estabelecida!');

    // Verificar se as colunas já existem
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'domains'
      AND column_name IN ('verify_token', 'verify_token_expires');
    `);

    const existingColumns = (results as any[]).map((r: any) => r.column_name);

    if (!existingColumns.includes('verify_token')) {
      await sequelize.query(`
        ALTER TABLE domains
        ADD COLUMN verify_token VARCHAR(255);
      `);
      logger.info('✅ Coluna verify_token adicionada!');
    } else {
      logger.info('ℹ️ Coluna verify_token já existe.');
    }

    if (!existingColumns.includes('verify_token_expires')) {
      await sequelize.query(`
        ALTER TABLE domains
        ADD COLUMN verify_token_expires TIMESTAMP;
      `);
      logger.info('✅ Coluna verify_token_expires adicionada!');
    } else {
      logger.info('ℹ️ Coluna verify_token_expires já existe.');
    }

    logger.info('✅ Campos adicionados com sucesso!');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Erro ao adicionar campos:', error.message);
    if (error.original) {
      logger.error('Detalhes:', error.original.message);
    }
    process.exit(1);
  }
}

addVerifyTokenToDomains();

