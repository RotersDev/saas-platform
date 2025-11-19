import { User } from '../models';
import sequelize from '../config/database';

async function updateUserRole() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Atualizar role do usuário jprotersiza@gmail.com para master_admin
    const [updated] = await User.update(
      { role: 'master_admin', store_id: null },
      { where: { email: 'jprotersiza@gmail.com' } }
    );

    if (updated > 0) {
      const user = await User.findOne({ where: { email: 'jprotersiza@gmail.com' } });
      console.log('✅ Role atualizada com sucesso!');
      console.log('📧 Email:', user?.email);
      console.log('👤 Role:', user?.role);
      console.log('\n🔄 Agora faça logout e login novamente para atualizar o token!');
    } else {
      console.log('❌ Usuário não encontrado ou já tem essa role');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
    process.exit(1);
  }
}

updateUserRole();

