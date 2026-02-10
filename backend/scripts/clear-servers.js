// Script para limpar servidores do banco de dados
// Use quando mudar a ENCRYPTION_KEY

require('dotenv').config();
const mongoose = require('mongoose');

async function clearServers() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Importar modelo Server
    const ServerSchema = new mongoose.Schema({
      name: String,
      host: String,
      port: Number,
      username: String,
      password: String,
      sshKey: String,
      userId: mongoose.Schema.Types.ObjectId,
      status: String,
      lastCheck: Date,
      stats: Object
    });
    
    const Server = mongoose.models.Server || mongoose.model('Server', ServerSchema);

    // Contar servidores
    const count = await Server.countDocuments();
    console.log(`📊 Encontrados ${count} servidores no banco`);

    if (count === 0) {
      console.log('✅ Nenhum servidor para limpar');
      process.exit(0);
    }

    // Confirmar
    console.log('\n⚠️  ATENÇÃO: Isso irá deletar TODOS os servidores do banco!');
    console.log('⚠️  Você precisará recadastrar os servidores após isso.');
    console.log('\nPressione Ctrl+C para cancelar ou aguarde 5 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Deletar todos os servidores
    const result = await Server.deleteMany({});
    console.log(`✅ ${result.deletedCount} servidores deletados com sucesso!`);

    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse o painel: http://localhost:8000');
    console.log('2. Vá em "Servidores"');
    console.log('3. Clique em "Adicionar Servidor"');
    console.log('4. Cadastre seus servidores novamente');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

clearServers();
