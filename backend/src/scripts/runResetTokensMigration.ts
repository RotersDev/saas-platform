import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar reset tokens...');

    const migrationSql = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;

      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;
    `;

    await sequelize.query(migrationSql, { type: QueryTypes.RAW });

    console.log('✅ Migração executada com sucesso!');
    console.log('\n📋 Campos adicionados:');
    console.log('  - users.reset_token');
    console.log('  - users.reset_token_expires_at');
    console.log('  - customers.reset_token');
    console.log('  - customers.reset_token_expires_at');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
}

runMigration();

