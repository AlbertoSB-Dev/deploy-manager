const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager')
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Definir schema
const databaseSchema = new mongoose.Schema({
  name: String,
  type: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serverId: mongoose.Schema.Types.ObjectId,
}, { collection: 'databases' });

const Database = mongoose.model('Database', databaseSchema);

async function cleanOrphanDatabases() {
  try {
    // Buscar bancos órfãos (sem usuário)
    const orphanDatabases = await Database.find({ user: null });
    
    if (orphanDatabases.length === 0) {
      console.log('✅ Nenhum banco de dados órfão encontrado');
      process.exit(0);
    }

    console.log(`\n⚠️  Encontrados ${orphanDatabases.length} banco(s) de dados órfão(s):`);
    orphanDatabases.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.name} (${db.type || 'N/A'}) - ID: ${db._id}`);
    });

    // Deletar
    const result = await Database.deleteMany({ user: null });
    
    console.log(`\n✅ ${result.deletedCount} banco(s) de dados órfão(s) deletado(s) com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexão fechada');
  }
}

cleanOrphanDatabases();
