import sequelize from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com o banco de dados...\n');
    console.log('📊 Configuração:');
    console.log(`   Host: ${process.env.DB_HOST || '127.0.0.1'}`);
    console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'saas_platform'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'não definida'}\n`);

    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar uma query simples
    const [results] = await sequelize.query('SELECT version();');
    console.log('📋 Versão do PostgreSQL:');
    console.log(results);

    // Verificar se o banco existe
    const [databases] = await sequelize.query(`
      SELECT datname FROM pg_database WHERE datname = '${process.env.DB_NAME || 'saas_platform'}';
    `);
    console.log('\n📦 Banco de dados encontrado:', databases);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao conectar:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    if (error.original) {
      console.error(`   Original: ${error.original.message || error.original.code || 'N/A'}`);
    }
    console.error('\n💡 Possíveis soluções:');
    console.error('   1. Verifique se o container está rodando: docker ps');
    console.error('   2. Verifique se o banco existe: docker exec saas_postgres psql -U postgres -l');
    console.error('   3. Crie o banco se não existir:');
    console.error('      docker exec saas_postgres psql -U postgres -c "CREATE DATABASE saas_platform;"');
    console.error('   4. Verifique as credenciais no arquivo .env\n');
    process.exit(1);
  }
}

testConnection();

