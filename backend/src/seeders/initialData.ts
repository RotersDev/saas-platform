import { Plan, User, Store } from '../models';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

export async function seedInitialData() {
  try {
    // Criar planos
    const basicPlan = await Plan.findOrCreate({
      where: { slug: 'basico' },
      defaults: {
        name: 'Plano Básico',
        slug: 'basico',
        price: 49.90,
        billing_cycle: 'monthly',
        max_products: 50,
        max_coupons: 10,
        max_visits: 10000,
        max_affiliates: 5,
        max_banners: 3,
        features: {
          custom_domain: false,
          white_label: false,
          api_access: false,
        },
        is_active: true,
      },
    });

    const premiumPlan = await Plan.findOrCreate({
      where: { slug: 'premium' },
      defaults: {
        name: 'Plano Premium',
        slug: 'premium',
        price: 149.90,
        billing_cycle: 'monthly',
        max_products: 500,
        max_coupons: 100,
        max_visits: 100000,
        max_affiliates: 50,
        max_banners: 20,
        features: {
          custom_domain: true,
          white_label: true,
          api_access: true,
        },
        is_active: true,
      },
    });

    // Criar usuário master admin
    const masterAdminPassword = await bcrypt.hash('admin123', 10);
    await User.findOrCreate({
      where: { email: 'admin@platform.com' },
      defaults: {
        name: 'Master Admin',
        email: 'admin@platform.com',
        password: masterAdminPassword,
        role: 'master_admin',
        is_active: true,
        store_id: null,
      },
    });

    console.log('✅ Dados iniciais criados com sucesso!');
    console.log('📧 Master Admin: admin@platform.com');
    console.log('🔑 Senha: admin123');
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  sequelize.authenticate().then(async () => {
    await seedInitialData();
    process.exit(0);
  });
}


