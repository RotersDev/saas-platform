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

async function setPlatformAccountId() {
  try {
    console.log('🔧 Configuração do Account ID da Plataforma para Split\n');
    console.log('Este Account ID será usado para receber a porcentagem das vendas dos lojistas.\n');

    // Verificar se já existe configuração
    const existing = await sequelize.query(
      `SELECT value FROM platform_settings WHERE key = 'pushin_pay_account_id'`,
      { type: QueryTypes.SELECT }
    ) as any[];

    if (existing.length > 0) {
      console.log(`Account ID atual: ${existing[0].value}`);
      const update = await question('\nDeseja atualizar? (s/n): ');
      if (update.toLowerCase() !== 's') {
        console.log('Operação cancelada.');
        rl.close();
        process.exit(0);
      }
    }

    const accountId = await question('\nDigite seu Account ID do Pushin Pay: ');

    if (!accountId.trim()) {
      console.log('❌ Account ID não pode ser vazio!');
      rl.close();
      process.exit(1);
    }

    // Criar tabela de configurações da plataforma se não existir
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, { type: QueryTypes.RAW });

    // Inserir ou atualizar
    await sequelize.query(`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES ('pushin_pay_account_id', :accountId, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = :accountId, updated_at = NOW();
    `, {
      replacements: { accountId: accountId.trim() },
      type: QueryTypes.INSERT,
    });

    console.log('\n✅ Account ID configurado com sucesso!');
    console.log(`\nSeu Account ID: ${accountId.trim()}`);
    console.log('\nAgora você receberá automaticamente a porcentagem configurada nas vendas dos lojistas.\n');

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao configurar Account ID:', error.message);
    rl.close();
    process.exit(1);
  }
}

setPlatformAccountId();

