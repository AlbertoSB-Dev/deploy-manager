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
  cpfCnpj: String,
  subscription: Object,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function addCpfToUsers() {
  try {
    console.log('\n📋 Buscando usuários sem CPF/CNPJ...\n');
    
    const usersWithoutCpf = await User.find({
      $or: [
        { cpfCnpj: { $exists: false } },
        { cpfCnpj: null },
        { cpfCnpj: '' }
      ]
    });

    if (usersWithoutCpf.length === 0) {
      console.log('✅ Todos os usuários já possuem CPF/CNPJ cadastrado!');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${usersWithoutCpf.length} usuário(s) sem CPF/CNPJ:\n`);

    for (const user of usersWithoutCpf) {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Status: ${user.subscription?.status || 'sem assinatura'}`);
      console.log('');
    }

    console.log('\n⚠️  ATENÇÃO: Para adicionar CPF/CNPJ aos usuários existentes:');
    console.log('1. Peça para cada usuário fazer logout e login novamente');
    console.log('2. Ou adicione manualmente via MongoDB:');
    console.log('   db.users.updateOne({ email: "email@exemplo.com" }, { $set: { cpfCnpj: "12345678900" } })');
    console.log('\n💡 Novos usuários já terão o campo CPF/CNPJ obrigatório no cadastro.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexão fechada');
    process.exit(0);
  }
}

addCpfToUsers();
