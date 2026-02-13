const mongoose = require('mongoose');
const readline = require('readline');
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateUserCpf() {
  try {
    console.log('\n📋 Atualizar CPF/CNPJ de Usuário\n');
    
    const email = await question('Digite o email do usuário: ');
    
    const user = await User.findOne({ email: email.trim() });
    
    if (!user) {
      console.log('❌ Usuário não encontrado!');
      rl.close();
      process.exit(1);
    }

    console.log(`\n👤 Usuário encontrado:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CPF/CNPJ atual: ${user.cpfCnpj || 'Não cadastrado'}`);
    console.log('');

    const cpfCnpj = await question('Digite o CPF (11 dígitos) ou CNPJ (14 dígitos): ');
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');

    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      console.log('❌ CPF/CNPJ inválido! Deve ter 11 ou 14 dígitos.');
      rl.close();
      process.exit(1);
    }

    const confirm = await question(`\nConfirmar atualização? (s/n): `);
    
    if (confirm.toLowerCase() !== 's') {
      console.log('❌ Operação cancelada');
      rl.close();
      process.exit(0);
    }

    user.cpfCnpj = cleanCpfCnpj;
    await user.save();

    console.log('\n✅ CPF/CNPJ atualizado com sucesso!');
    console.log(`   ${cleanCpfCnpj.length === 11 ? 'CPF' : 'CNPJ'}: ${cleanCpfCnpj}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n✅ Conexão fechada');
    process.exit(0);
  }
}

updateUserCpf();
