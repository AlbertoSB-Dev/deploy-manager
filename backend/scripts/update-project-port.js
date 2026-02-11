const mongoose = require('mongoose');
require('dotenv').config();

async function updateProjectPort() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    
    if (!project) {
      console.log('❌ Projeto não encontrado');
      process.exit(1);
    }
    
    console.log(`📦 Projeto: ${project.name}`);
    console.log(`🔌 Porta atual: ${project.port}`);
    
    // Atualizar porta para 8000 (porta que a aplicação está usando)
    project.port = 8000;
    await project.save();
    
    console.log(`✅ Porta atualizada para: 8000`);
    console.log('\n💡 Agora execute: node scripts/fix-container-labels.js');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

updateProjectPort();
