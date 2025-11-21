/**
 * Script de diagnóstico para verificar loja e produtos no banco
 * Uso: npm run diagnose-store -- <subdomain>
 */

import dotenv from 'dotenv';
import sequelize from '../config/database';
import { Store, Product, Category } from '../models';

dotenv.config();

async function diagnoseStore(subdomain: string) {
  try {
    console.log('🔍 Iniciando diagnóstico para subdomain:', subdomain);
    console.log('');

    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    console.log('');

    // Buscar loja
    const store = await Store.findOne({ where: { subdomain } });

    if (!store) {
      console.log('❌ Loja não encontrada com subdomain:', subdomain);
      console.log('');
      console.log('📋 Lojas disponíveis no banco:');
      const allStores = await Store.findAll({
        attributes: ['id', 'name', 'subdomain', 'status'],
        limit: 20,
      });
      allStores.forEach(s => {
        console.log(`  - ${s.subdomain} (ID: ${s.id}) - ${s.name} - Status: ${s.status}`);
      });
      process.exit(1);
    }

    console.log('✅ Loja encontrada:');
    console.log(`  - ID: ${store.id}`);
    console.log(`  - Nome: ${store.name}`);
    console.log(`  - Subdomain: ${store.subdomain}`);
    console.log(`  - Status: ${store.status}`);
    console.log(`  - Email: ${store.email}`);
    console.log('');

    // Contar produtos
    const totalProducts = await Product.count({ where: { store_id: store.id } });
    const activeProducts = await Product.count({ where: { store_id: store.id, is_active: true } });
    const inactiveProducts = await Product.count({ where: { store_id: store.id, is_active: false } });

    console.log('📦 Produtos:');
    console.log(`  - Total: ${totalProducts}`);
    console.log(`  - Ativos: ${activeProducts}`);
    console.log(`  - Inativos: ${inactiveProducts}`);
    console.log('');

    if (totalProducts > 0) {
      console.log('📋 Lista de produtos:');
      const products = await Product.findAll({
        where: { store_id: store.id },
        attributes: ['id', 'name', 'slug', 'is_active', 'price', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      products.forEach(p => {
        const status = p.is_active ? '✅ Ativo' : '❌ Inativo';
        console.log(`  ${status} - ${p.name} (ID: ${p.id}) - R$ ${p.price} - Slug: ${p.slug}`);
      });
      console.log('');
    } else {
      console.log('⚠️ Nenhum produto encontrado para esta loja');
      console.log('');
    }

    // Contar categorias
    const totalCategories = await Category.count({ where: { store_id: store.id } });
    const activeCategories = await Category.count({ where: { store_id: store.id, is_active: true } });

    console.log('📁 Categorias:');
    console.log(`  - Total: ${totalCategories}`);
    console.log(`  - Ativas: ${activeCategories}`);
    console.log('');

    // Verificar se há produtos ativos
    if (activeProducts === 0 && totalProducts > 0) {
      console.log('⚠️ ATENÇÃO: Existem produtos mas nenhum está ativo!');
      console.log('   Os produtos precisam ter is_active = true para aparecer na loja pública');
      console.log('');
    }

    if (activeProducts > 0) {
      console.log('✅ Loja configurada corretamente!');
      console.log(`   ${activeProducts} produto(s) ativo(s) disponível(is) para venda`);
    } else {
      console.log('❌ Loja sem produtos ativos');
      console.log('   Adicione produtos e certifique-se de que estão ativos (is_active = true)');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Pegar subdomain dos argumentos
const subdomain = process.argv[2];

if (!subdomain) {
  console.error('❌ Por favor, forneça o subdomain como argumento');
  console.error('   Uso: npm run diagnose-store -- <subdomain>');
  console.error('   Exemplo: npm run diagnose-store -- marcosstore');
  process.exit(1);
}

diagnoseStore(subdomain);

