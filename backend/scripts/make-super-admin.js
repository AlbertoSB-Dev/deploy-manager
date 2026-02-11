#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function makeSuperAdmin() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Definir schema do User
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      subscription: {
        status: String,
        startDate: Date,
        endDate: Date,
      },
      createdAt: Date,
      updatedAt: Date,
    });

    const User = mongoose.model('User', UserSchema);

    // Buscar usuário admin existente
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('❌ Nenhum usuário admin encontrado');
      console.log('   Execute primeiro: npm run make-admin-auto');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`\n👤 Usuário encontrado: ${adminUser.name} (${adminUser.email})`);
    console.log(`   Role atual: ${adminUser.role}`);

    // Atualizar para super_admin
    adminUser.role = 'super_admin';
    await adminUser.save();

    console.log(`\n✅ Usuário promovido para super_admin!`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);

    console.log('\n📝 Permissões do Super Admin:');
    console.log('   ✅ Gerenciar todos os usuários');
    console.log('   ✅ Gerenciar todos os planos');
    console.log('   ✅ Gerenciar todos os servidores');
    console.log('   ✅ Gerenciar pagamentos');
    console.log('   ✅ Acessar painel de deploy');
    console.log('   ✅ Ver relatórios e estatísticas');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

makeSuperAdmin();
