const mongoose = require('mongoose');
require('dotenv').config();

async function removeUniqueIndex() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    console.log('✅ Conectado ao MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('projects');

    console.log('\n📋 Índices atuais:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(ÚNICO)' : '');
    });

    // Remover índice único name_1_userId_1
    console.log('\n🗑️  Removendo índices únicos...');
    try {
      await collection.dropIndex('name_1_userId_1');
      console.log('✅ Índice name_1_userId_1 removido');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  Índice name_1_userId_1 já foi removido');
      } else {
        console.log('⚠️  Erro ao remover name_1_userId_1:', error.message);
      }
    }

    // Remover índice único name_1 se existir
    try {
      const nameIndex = indexes.find(idx => idx.name === 'name_1');
      if (nameIndex && nameIndex.unique) {
        await collection.dropIndex('name_1');
        console.log('✅ Índice único name_1 removido');
      }
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  Índice name_1 já foi removido');
      } else {
        console.log('⚠️  Erro ao remover name_1:', error.message);
      }
    }

    // Criar novos índices (não únicos)
    console.log('\n📝 Criando novos índices (não únicos)...');
    
    try {
      await collection.createIndex({ userId: 1 });
      console.log('✅ Índice userId criado');
    } catch (error) {
      console.log('ℹ️  Índice userId já existe');
    }
    
    try {
      await collection.createIndex({ name: 1 });
      console.log('✅ Índice name criado');
    } catch (error) {
      console.log('ℹ️  Índice name já existe');
    }

    console.log('\n📋 Índices finais:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(ÚNICO)' : '');
    });

    console.log('\n✅ Migração concluída! Agora você pode criar projetos com nomes duplicados.');
    console.log('💡 Cada projeto será identificado pelo seu ID único (_id)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

removeUniqueIndex();
