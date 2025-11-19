import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar pushin_pay_id...');

    const migrationSql = `
      -- Adicionar campo pushin_pay_id
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS pushin_pay_id VARCHAR(255);

      -- Tornar mercado_pago_id opcional
      ALTER TABLE payments
      ALTER COLUMN mercado_pago_id DROP NOT NULL;
    `;

    await sequelize.query(migrationSql, { type: QueryTypes.RAW });

    console.log('✅ Migração executada com sucesso!');
    console.log('\n📋 Campos atualizados:');
    console.log('  - pushin_pay_id: adicionado');
    console.log('  - mercado_pago_id: agora é opcional');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    process.exit(1);
  }
}

runMigration();

