const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager')
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Schema do User
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  subscription: Object,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function makeUserSuperAdmin() {
  try {
    // Pegar email da linha de comando ou usar o do token
    const email = process.argv[2] || 'beto@gmail.com';
    
    console.log(`\n🔍 Buscando usuário: ${email}\n`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      console.log('\n💡 Usuários disponíveis:');
      const users = await User.find({}, 'email name role');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - Role: ${u.role}`);
      });
      process.exit(1);
    }

    console.log(`👤 Usuário encontrado:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);
    console.log(`   Subscription: ${user.subscription?.status || 'Nenhuma'}`);
    console.log('');

    if (user.role === 'super_admin') {
      console.log('✅ Usuário já é super_admin!');
      process.exit(0);
    }

    // Atualizar para super_admin
    user.role = 'super_admin';
    await user.save();

    console.log('✅ Usuário promovido para SUPER_ADMIN com sucesso!');
    console.log('');
    console.log('🔐 Agora você tem acesso a:');
    console.log('   ✅ Painel de Administração');
    console.log('   ✅ Gerenciamento de Usuários');
    console.log('   ✅ Gerenciamento de Planos');
    console.log('   ✅ Gerenciamento de Assinaturas');
    console.log('   ✅ Receita e Financeiro');
    console.log('   ✅ Configurações do Sistema');
    console.log('   ✅ Monitoramento');
    console.log('   ✅ Deploy do Painel');
    console.log('');
    console.log('🚀 Faça logout e login novamente para aplicar as mudanças!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexão fechada');
    process.exit(0);
  }
}

makeUserSuperAdmin();
