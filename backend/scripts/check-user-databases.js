const mongoose = require('mongoose');
require('dotenv').config();

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

async function checkUserDatabases() {
  try {
    // Buscar usuário
    const user = await User.findOne({ email: 'beto@gmail.com' });
    
    if (!user) {
      console.log('❌ Usuário beto@gmail.com não encontrado');
      process.exit(1);
    }

    console.log('\n📊 Usuário encontrado:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Nome: ${user.name}`);
    console.log(`  Email: ${user.email}`);

    // Buscar bancos de dados do usuário
    const databases = await Database.find({ user: user._id });
    
    console.log(`\n💾 Bancos de dados do usuário: ${databases.length}`);
    
    if (databases.length > 0) {
      console.log('\nDetalhes:');
      databases.forEach((db, index) => {
        console.log(`\n  ${index + 1}. ${db.name}`);
        console.log(`     Tipo: ${db.type}`);
        console.log(`     ID: ${db._id}`);
        console.log(`     Servidor: ${db.serverId || 'N/A'}`);
      });

      // Perguntar se quer deletar
      console.log('\n⚠️  Para deletar esses bancos de dados, execute:');
      console.log('     node scripts/delete-user-databases.js beto@gmail.com');
    } else {
      console.log('✅ Nenhum banco de dados encontrado para este usuário');
    }

    // Verificar bancos órfãos (sem usuário)
    const orphanDatabases = await Database.find({ user: null });
    
    if (orphanDatabases.length > 0) {
      console.log(`\n⚠️  Bancos de dados órfãos (sem usuário): ${orphanDatabases.length}`);
      orphanDatabases.forEach((db, index) => {
        console.log(`  ${index + 1}. ${db.name} (ID: ${db._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexão fechada');
  }
}

checkUserDatabases();
