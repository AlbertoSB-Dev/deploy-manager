const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager';

async function createAdmin() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Definir schema do User
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      planId: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', UserSchema);

    // Verificar se já existe admin
    const existingAdmin = await User.findOne({ email: 'beto.albertosantanabeto@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      console.log(`   Email: beto.albertosantanabeto@gmail.com`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      if (existingAdmin.role !== 'admin') {
        await User.findByIdAndUpdate(existingAdmin._id, { role: 'admin' });
        console.log('✅ Role atualizada para admin');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Criar senha hash
    const hashedPassword = await bcrypt.hash('DeuseBom040211', 10);

    // Criar usuário admin
    const admin = new User({
      name: 'Beto',
      email: 'beto.albertosantanabeto@gmail.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });

    await admin.save();

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔑 Credenciais de Acesso:');
    console.log('   Email: beto.albertosantanabeto@gmail.com');
    console.log('   Senha: DeuseBom040211');
    console.log('═══════════════════════════════════════════════════════════');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();
