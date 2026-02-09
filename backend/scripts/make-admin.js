const mongoose = require('mongoose');
const readline = require('readline');

// Configurar readline para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

async function makeAdmin() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Definir schema do User
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    });

    const User = mongoose.model('User', UserSchema);

    // Listar todos os usuários
    const users = await User.find().select('name email role');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
      console.log('   Crie uma conta primeiro através do sistema de registro.\n');
      process.exit(0);
    }

    console.log('📋 Usuários cadastrados:\n');
    users.forEach((user, index) => {
      const roleLabel = user.role === 'admin' ? '👑 ADMIN' : '👤 USER';
      console.log(`${index + 1}. ${roleLabel} - ${user.name} (${user.email})`);
    });

    console.log('\n');

    // Perguntar qual usuário tornar admin
    rl.question('Digite o número do usuário que deseja tornar ADMIN: ', async (answer) => {
      const index = parseInt(answer) - 1;

      if (isNaN(index) || index < 0 || index >= users.length) {
        console.log('❌ Número inválido!');
        await mongoose.disconnect();
        process.exit(1);
      }

      const selectedUser = users[index];

      if (selectedUser.role === 'admin') {
        console.log(`\n⚠️  ${selectedUser.name} já é um administrador!`);
        await mongoose.disconnect();
        process.exit(0);
      }

      // Atualizar para admin
      await User.findByIdAndUpdate(selectedUser._id, { role: 'admin' });

      console.log(`\n✅ ${selectedUser.name} agora é um ADMINISTRADOR!`);
      console.log('\n📝 Próximos passos:');
      console.log('   1. Faça login com esta conta');
      console.log('   2. Clique no menu do usuário (canto superior direito)');
      console.log('   3. Clique em "Painel Admin"');
      console.log('   4. Acesse: http://localhost:8000/admin\n');

      await mongoose.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

makeAdmin();
