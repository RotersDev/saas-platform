import sequelize from '../config/database';
import '../models/index'; // Importar todos os modelos

async function syncDatabase() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida!');

    console.log('🔄 Sincronizando tabelas...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelas sincronizadas com sucesso!');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar banco:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    process.exit(1);
  }
}

syncDatabase();
