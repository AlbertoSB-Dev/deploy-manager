const mongoose = require('mongoose');

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

    // Pegar o email do argumento ou usar o primeiro usuário
    const targetEmail = process.argv[2];

    if (targetEmail) {
      // Buscar usuário específico
      const user = await User.findOne({ email: targetEmail });
      
      if (!user) {
        console.log(`❌ Usuário com email "${targetEmail}" não encontrado.`);
        await mongoose.disconnect();
        process.exit(1);
      }

      if (user.role === 'admin') {
        console.log(`\n⚠️  ${user.name} já é um administrador!`);
        await mongoose.disconnect();
        process.exit(0);
      }

      // Atualizar para admin
      await User.findByIdAndUpdate(user._id, { role: 'admin' });

      console.log(`\n✅ ${user.name} (${user.email}) agora é um ADMINISTRADOR!`);
    } else {
      // Listar todos os usuários
      const users = await User.find().select('name email role');
      
      if (users.length === 0) {
        console.log('❌ Nenhum usuário encontrado no banco de dados.');
        await mongoose.disconnect();
        process.exit(0);
      }

      console.log('📋 Usuários cadastrados:\n');
      users.forEach((user, index) => {
        const roleLabel = user.role === 'admin' ? '👑 ADMIN' : '👤 USER';
        console.log(`${index + 1}. ${roleLabel} - ${user.name} (${user.email})`);
      });

      console.log('\n💡 Para tornar um usuário admin, execute:');
      console.log('   node scripts/make-admin-auto.js email@exemplo.com\n');
    }

    console.log('\n📝 Próximos passos:');
    console.log('   1. Faça login com a conta admin');
    console.log('   2. Clique no menu do usuário (canto superior direito)');
    console.log('   3. Clique em "Painel Admin"');
    console.log('   4. Acesse: http://localhost:8000/admin\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

makeAdmin();
