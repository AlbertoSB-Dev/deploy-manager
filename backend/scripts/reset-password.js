const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

async function resetPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('❌ Uso incorreto!');
      console.log('\n📝 Como usar:');
      console.log('   node scripts/reset-password.js email@exemplo.com novaSenha123\n');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.log('❌ A senha deve ter no mínimo 6 caracteres!\n');
      process.exit(1);
    }

    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Definir schema do User
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    });

    const User = mongoose.model('User', UserSchema);

    // Buscar usuário
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ Usuário com email "${email}" não encontrado.\n`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Criptografar nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar senha
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    console.log(`✅ Senha atualizada com sucesso!\n`);
    console.log(`👤 Usuário: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    console.log(`👑 Role: ${user.role}\n`);
    console.log('📝 Agora você pode fazer login com a nova senha!\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetPassword();
