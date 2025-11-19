import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Executando migração de payment_methods...');

    const migrationPath = path.join(__dirname, '../migrations/003_add_payment_methods.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Executar o SQL completo de uma vez (PostgreSQL suporta múltiplos comandos)
    // Remover comentários e linhas vazias
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    await sequelize.query(cleanSQL, { type: QueryTypes.RAW });

    console.log('✅ Migração executada com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

