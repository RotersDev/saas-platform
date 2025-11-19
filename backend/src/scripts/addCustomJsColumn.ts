import sequelize from '../config/database';

async function addCustomJsColumn() {
  try {
    console.log('🔄 Adicionando coluna custom_js à tabela themes...');

    await sequelize.query(`
      ALTER TABLE themes
      ADD COLUMN IF NOT EXISTS custom_js TEXT;
    `);

    console.log('✅ Coluna custom_js adicionada com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    process.exit(1);
  }
}

addCustomJsColumn();

