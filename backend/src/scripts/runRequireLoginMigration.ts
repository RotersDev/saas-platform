import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar require_login_to_purchase...');

    const migrationSql = `
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS require_login_to_purchase BOOLEAN NOT NULL DEFAULT false;
    `;

    await sequelize.query(migrationSql, { type: QueryTypes.RAW });

    console.log('✅ Migração executada com sucesso!');
    console.log('\n📋 Campo adicionado:');
    console.log('  - require_login_to_purchase: controla se login é obrigatório para comprar');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
}

runMigration();

