import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function configurePlatformSplit() {
  try {
    const PLATFORM_ACCOUNT_ID = '9E859C2A-2C80-4B3E-BA9F-A27EFC93BEC4';

    console.log('🔧 Configurando Split da Plataforma\n');
    console.log(`Account ID: ${PLATFORM_ACCOUNT_ID}\n`);

    // Criar tabela de configurações se não existir
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

    console.log('✅ Account ID salvo nas configurações da plataforma!\n');

    // Perguntar se quer configurar split para lojas
    const configure = await question('Deseja configurar split para lojas existentes? (s/n): ');

    if (configure.toLowerCase() === 's') {
      const percentage = await question('Qual porcentagem você quer receber? (ex: 10 para 10%): ');
      const percentageNum = parseFloat(percentage);

      if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 50) {
        console.log('❌ Porcentagem inválida! Deve ser entre 0 e 50.');
        rl.close();
        process.exit(1);
      }

      const scope = await question('\nConfigurar para:\n1 - Todas as lojas\n2 - Loja específica\nEscolha (1 ou 2): ');

      if (scope === '1') {
        // Configurar para todas as lojas
        await sequelize.query(`
          UPDATE split_configs
          SET
            split_1_percentage = :percentage,
            split_1_pushin_pay_account = :accountId,
            is_active = true
          WHERE store_id IN (SELECT id FROM stores);
        `, {
          replacements: {
            percentage: percentageNum,
            accountId: PLATFORM_ACCOUNT_ID
          },
          type: QueryTypes.UPDATE,
        });

        console.log(`\n✅ Split de ${percentageNum}% configurado para todas as lojas!`);
      } else if (scope === '2') {
        const storeId = await question('Digite o ID da loja: ');
        const storeIdNum = parseInt(storeId);

        if (isNaN(storeIdNum)) {
          console.log('❌ ID da loja inválido!');
          rl.close();
          process.exit(1);
        }

        await sequelize.query(`
          UPDATE split_configs
          SET
            split_1_percentage = :percentage,
            split_1_pushin_pay_account = :accountId,
            is_active = true
          WHERE store_id = :storeId;
        `, {
          replacements: {
            percentage: percentageNum,
            accountId: PLATFORM_ACCOUNT_ID,
            storeId: storeIdNum
          },
          type: QueryTypes.UPDATE,
        });

        console.log(`\n✅ Split de ${percentageNum}% configurado para a loja ${storeIdNum}!`);
      }
    }

    console.log('\n✅ Configuração concluída!');
    console.log(`\nSeu Account ID: ${PLATFORM_ACCOUNT_ID}`);
    console.log('Agora você receberá automaticamente a porcentagem configurada nas vendas.\n');

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao configurar:', error.message);
    rl.close();
    process.exit(1);
  }
}

configurePlatformSplit();

