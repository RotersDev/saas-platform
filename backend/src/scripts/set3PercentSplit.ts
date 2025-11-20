import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

async function set3PercentSplit() {
  try {
    const PLATFORM_ACCOUNT_ID = '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4';
    const PERCENTAGE = 3.00;

    console.log('🔧 Configurando Split de 3% para todas as lojas\n');
    console.log(`Account ID: ${PLATFORM_ACCOUNT_ID}`);
    console.log(`Porcentagem: ${PERCENTAGE}%\n`);

    // Garantir que a tabela platform_settings existe
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, { type: QueryTypes.RAW });

    // Salvar Account ID
    await sequelize.query(`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES ('pushin_pay_account_id', :accountId, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = :accountId, updated_at = NOW();
    `, {
      replacements: { accountId: PLATFORM_ACCOUNT_ID },
      type: QueryTypes.INSERT,
    });

    console.log('✅ Account ID salvo!\n');

    // Configurar split de 3% para todas as lojas
    await sequelize.query(`
      UPDATE split_configs
      SET
        split_1_percentage = :percentage,
        split_1_pushin_pay_account = :accountId,
        is_active = true,
        updated_at = NOW()
      WHERE store_id IN (SELECT id FROM stores);
    `, {
      replacements: {
        percentage: PERCENTAGE,
        accountId: PLATFORM_ACCOUNT_ID
      },
      type: QueryTypes.UPDATE,
    });

    // Verificar quantas lojas foram atualizadas
    const storesUpdated = await sequelize.query(`
      SELECT COUNT(*) as count FROM split_configs
      WHERE split_1_pushin_pay_account = :accountId
      AND split_1_percentage = :percentage
    `, {
      replacements: {
        accountId: PLATFORM_ACCOUNT_ID,
        percentage: PERCENTAGE
      },
      type: QueryTypes.SELECT,
    }) as any[];

    console.log(`✅ Split de ${PERCENTAGE}% configurado para ${storesUpdated[0]?.count || 0} loja(s)!`);
    console.log('\n📊 Configuração:');
    console.log(`   - Account ID: ${PLATFORM_ACCOUNT_ID}`);
    console.log(`   - Porcentagem: ${PERCENTAGE}%`);
    console.log(`   - Status: Ativo\n`);
    console.log('💰 Agora você receberá 3% de todas as vendas automaticamente!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao configurar split:', error.message);
    console.error(error);
    process.exit(1);
  }
}

set3PercentSplit();

