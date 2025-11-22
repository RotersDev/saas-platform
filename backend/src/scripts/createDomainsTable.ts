import sequelize from '../config/database';
import logger from '../config/logger';

async function createDomainsTable() {
  try {
    logger.info('🔄 Verificando/criando tabela domains...');

    await sequelize.authenticate();
    logger.info('✅ Conexão estabelecida!');

    // Verificar se a tabela já existe
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'domains'
      );
    `);

    const tableExists = (results as any[])[0]?.exists;

    if (tableExists) {
      logger.info('ℹ️ Tabela domains já existe.');

      // Verificar se todas as colunas existem
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'domains';
      `);

      const existingColumns = (columns as any[]).map((c: any) => c.column_name);
      const requiredColumns = {
        'id': 'SERIAL PRIMARY KEY',
        'store_id': 'INTEGER NOT NULL',
        'domain': 'VARCHAR(255) NOT NULL',
        'is_primary': 'BOOLEAN NOT NULL DEFAULT false',
        'ssl_enabled': 'BOOLEAN NOT NULL DEFAULT false',
        'ssl_certificate': 'TEXT',
        'ssl_key': 'TEXT',
        'verified': 'BOOLEAN NOT NULL DEFAULT false',
        'verified_at': 'TIMESTAMP',
        'verify_token': 'VARCHAR(255)',
        'verify_token_expires': 'TIMESTAMP',
        'created_at': 'TIMESTAMP NOT NULL DEFAULT NOW()',
        'updated_at': 'TIMESTAMP NOT NULL DEFAULT NOW()',
      };

      const missingColumns = Object.keys(requiredColumns).filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        logger.info(`⚠️ Colunas faltando: ${missingColumns.join(', ')}`);
        logger.info('🔄 Adicionando colunas faltantes...');

        for (const col of missingColumns) {
          try {
            if (col === 'id') {
              // ID já deve existir como PRIMARY KEY
              continue;
            }

            const colDef = requiredColumns[col as keyof typeof requiredColumns];
            await sequelize.query(`
              ALTER TABLE domains
              ADD COLUMN ${col} ${colDef};
            `);
            logger.info(`✅ Coluna ${col} adicionada!`);
          } catch (error: any) {
            if (error.message && error.message.includes('already exists')) {
              logger.info(`ℹ️ Coluna ${col} já existe.`);
            } else {
              logger.warn(`⚠️ Erro ao adicionar coluna ${col}:`, error.message);
            }
          }
        }
      } else {
        logger.info('✅ Todas as colunas já existem.');
      }

      // Verificar índices
      const [indexes] = await sequelize.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'domains';
      `);

      const existingIndexes = (indexes as any[]).map((i: any) => i.indexname);

      if (!existingIndexes.some(idx => idx.includes('store_id'))) {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS domains_store_id_idx ON domains(store_id);
        `);
        logger.info('✅ Índice store_id criado!');
      }

      if (!existingIndexes.some(idx => idx.includes('domain'))) {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS domains_domain_idx ON domains(domain);
        `);
        logger.info('✅ Índice domain criado!');
      }

      // Verificar constraint UNIQUE em domain
      const [constraints] = await sequelize.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'domains' AND constraint_type = 'UNIQUE';
      `);

      const hasUniqueDomain = (constraints as any[]).some((c: any) =>
        c.constraint_name.includes('domain')
      );

      if (!hasUniqueDomain) {
        try {
          await sequelize.query(`
            ALTER TABLE domains
            ADD CONSTRAINT domains_domain_unique UNIQUE (domain);
          `);
          logger.info('✅ Constraint UNIQUE em domain criada!');
        } catch (error: any) {
          if (error.message && error.message.includes('already exists')) {
            logger.info('ℹ️ Constraint UNIQUE em domain já existe.');
          } else {
            logger.warn('⚠️ Erro ao criar constraint UNIQUE:', error.message);
          }
        }
      }
    } else {
      logger.info('🔄 Criando tabela domains...');

      await sequelize.query(`
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
      `);

      await sequelize.query(`
        CREATE INDEX domains_store_id_idx ON domains(store_id);
      `);

      await sequelize.query(`
        CREATE INDEX domains_domain_idx ON domains(domain);
      `);

      logger.info('✅ Tabela domains criada com sucesso!');
    }

    logger.info('✅ Processo concluído!');
    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Erro ao criar tabela domains:', error.message);
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

createDomainsTable();

