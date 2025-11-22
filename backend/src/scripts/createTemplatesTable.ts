import sequelize from '../config/database';
import logger from '../config/logger';

async function createTemplatesTable() {
  try {
    logger.info('🔄 Verificando/criando tabela templates...');

    await sequelize.authenticate();
    logger.info('✅ Conexão estabelecida!');

    // Verificar se a tabela já existe
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'templates'
      );
    `);

    const tableExists = (results as any[])[0]?.exists;

    if (tableExists) {
      logger.info('ℹ️ Tabela templates já existe.');

      // Verificar se todas as colunas existem
      const [columns] = await sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'templates';
      `);

      const existingColumns = (columns as any[]).map((c: any) => c.column_name);
      const requiredColumns = ['id', 'store_id', 'name', 'is_default', 'is_active', 'custom_css', 'custom_js', 'created_at', 'updated_at'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        logger.info(`⚠️ Colunas faltando: ${missingColumns.join(', ')}`);
        logger.info('🔄 Adicionando colunas faltantes...');

        if (!existingColumns.includes('id')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN id SERIAL PRIMARY KEY;
          `);
        }

        if (!existingColumns.includes('store_id')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN store_id INTEGER NOT NULL;
          `);
        }

        if (!existingColumns.includes('name')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN name VARCHAR(255) NOT NULL;
          `);
        }

        if (!existingColumns.includes('is_default')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
          `);
        }

        if (!existingColumns.includes('is_active')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;
          `);
        }

        if (!existingColumns.includes('custom_css')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN custom_css TEXT;
          `);
        }

        if (!existingColumns.includes('custom_js')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN custom_js TEXT;
          `);
        }

        if (!existingColumns.includes('created_at')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
          `);
        }

        if (!existingColumns.includes('updated_at')) {
          await sequelize.query(`
            ALTER TABLE templates
            ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
          `);
        }

        logger.info('✅ Colunas adicionadas!');
      } else {
        logger.info('✅ Todas as colunas já existem.');
      }

      // Verificar índices
      const [indexes] = await sequelize.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'templates';
      `);

      const existingIndexes = (indexes as any[]).map((i: any) => i.indexname);

      if (!existingIndexes.some(idx => idx.includes('store_id'))) {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS templates_store_id_idx ON templates(store_id);
        `);
        logger.info('✅ Índice store_id criado!');
      }

      if (!existingIndexes.some(idx => idx.includes('store_id') && idx.includes('is_active'))) {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS templates_store_id_is_active_idx ON templates(store_id, is_active);
        `);
        logger.info('✅ Índice store_id + is_active criado!');
      }
    } else {
      logger.info('🔄 Criando tabela templates...');

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS templates (
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
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS templates_store_id_idx ON templates(store_id);
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS templates_store_id_is_active_idx ON templates(store_id, is_active);
      `);

      logger.info('✅ Tabela templates criada com sucesso!');
    }

    logger.info('✅ Processo concluído!');
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Erro ao criar tabela templates:', error.message);
    if (error.original) {
      logger.error('Detalhes:', error.original.message);
    }
    console.error(error);
    try {
      await sequelize.close();
    } catch {}
    process.exit(1);
  }
}

createTemplatesTable();

