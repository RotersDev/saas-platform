/**
 * Script para testar conexão com o banco de dados
 * Uso: npm run test-db
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    console.log('');

    // Forçar IPv4
    let dbHost = process.env.DB_HOST || '127.0.0.1';
    if (dbHost === 'localhost') {
      dbHost = '127.0.0.1';
    }
    const dbPort = parseInt(process.env.DB_PORT || '5432');
    const dbUser = process.env.DB_USER || 'postgres';
    const dbName = process.env.DB_NAME || 'saas_platform';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';

    console.log('📋 Configurações:');
    console.log(`  - Host: ${dbHost}`);
    console.log(`  - Port: ${dbPort}`);
    console.log(`  - User: ${dbUser}`);
    console.log(`  - Database: ${dbName}`);
    console.log(`  - Password: ${dbPassword ? '***' + dbPassword.slice(-2) : 'NÃO DEFINIDA'}`);
    console.log('');

    const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

    const sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        connectTimeout: 5000,
      },
    });

    console.log('🔄 Tentando conectar...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');

    // Testar query simples
    console.log('🔄 Testando query...');
    const [results] = await sequelize.query('SELECT version() as version');
    console.log('✅ Query executada com sucesso!');
    console.log('');

    // Verificar se o banco tem tabelas
    console.log('🔄 Verificando tabelas...');
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (Array.isArray(tables) && tables.length > 0) {
      console.log(`✅ Encontradas ${tables.length} tabela(s):`);
      (tables as any[]).slice(0, 10).forEach((t: any) => {
        console.log(`  - ${t.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`  ... e mais ${tables.length - 10} tabela(s)`);
      }
    } else {
      console.log('⚠️ Nenhuma tabela encontrada no banco');
    }

    await sequelize.close();
    console.log('');
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ ERRO ao conectar ao banco de dados:');
    console.error('');

    if (error.message?.includes('password authentication failed')) {
      console.error('🔴 PROBLEMA: Senha incorreta!');
      console.error('');
      console.error('📝 SOLUÇÃO:');
      console.error('  1. Verifique a senha do PostgreSQL no arquivo .env');
      console.error('  2. A senha deve corresponder à senha configurada no PostgreSQL');
      console.error('  3. Para redefinir a senha do PostgreSQL, execute:');
      console.error('     sudo -u postgres psql');
      console.error('     ALTER USER postgres PASSWORD \'sua_nova_senha\';');
      console.error('');
    } else if (error.message?.includes('does not exist')) {
      console.error('🔴 PROBLEMA: Banco de dados não existe!');
      console.error('');
      console.error('📝 SOLUÇÃO:');
      console.error('  1. Crie o banco de dados:');
      console.error('     sudo -u postgres createdb saas_platform');
      console.error('');
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      console.error('🔴 PROBLEMA: Não foi possível conectar ao PostgreSQL!');
      console.error('');
      console.error('📝 SOLUÇÃO:');
      console.error('  1. Verifique se o PostgreSQL está rodando:');
      console.error('     sudo systemctl status postgresql');
      console.error('  2. Se não estiver rodando, inicie:');
      console.error('     sudo systemctl start postgresql');
      console.error('');
    } else {
      console.error('Erro:', error.message);
    }

    console.error('Erro completo:', error);
    process.exit(1);
  }
}

testConnection();

