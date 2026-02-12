const mongoose = require('mongoose');
require('dotenv').config();

const email = process.argv[2];

if (!email) {
  console.log('❌ Uso: node scripts/delete-user-databases.js <email>');
  console.log('   Exemplo: node scripts/delete-user-databases.js beto@gmail.com');
  process.exit(1);
}

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager')
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Definir schemas
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
}, { collection: 'users' });

const databaseSchema = new mongoose.Schema({
  name: String,
  type: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serverId: mongoose.Schema.Types.ObjectId,
}, { collection: 'databases' });

const User = mongoose.model('User', userSchema);
const Database = mongoose.model('Database', databaseSchema);

async function deleteUserDatabases() {
  try {
    // Buscar usuário
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado`);
      process.exit(1);
    }

    console.log(`\n📊 Usuário: ${user.name} (${user.email})`);

    // Buscar bancos de dados do usuário
    const databases = await Database.find({ user: user._id });
    
    if (databases.length === 0) {
      console.log('✅ Nenhum banco de dados encontrado para deletar');
      process.exit(0);
    }

    console.log(`\n💾 Encontrados ${databases.length} banco(s) de dados:`);
    databases.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.name} (${db.type})`);
    });

    // Deletar
    const result = await Database.deleteMany({ user: user._id });
    
    console.log(`\n✅ ${result.deletedCount} banco(s) de dados deletado(s) com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexão fechada');
  }
}

deleteUserDatabases();
