import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar password aos clientes...');

    const migrationSql = `
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `;

    await sequelize.query(migrationSql, { type: QueryTypes.RAW });

    console.log('✅ Migração executada com sucesso!');
    console.log('\n📋 Campo adicionado:');
    console.log('  - password: campo opcional para login de clientes');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
}

runMigration();

