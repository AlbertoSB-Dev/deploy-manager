const mongoose = require('mongoose');
require('dotenv').config();

async function updateContainerId() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    
    console.log(`📦 Projeto: ${project.name}`);
    console.log(`🆔 Container ID antigo: ${project.containerId}`);
    
    // Atualizar para o container correto (ID completo)
    const newContainerId = '5315349d167a7a0e2212f2686cc3a2ebf8528897081327779aca5c4d97b650c4';
    project.containerId = newContainerId;
    await project.save();
    
    console.log(`✅ Container ID atualizado: ${newContainerId.substring(0, 12)}`);
    console.log('\n💡 Agora execute: node scripts/setup-nginx-proxy.js');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

updateContainerId();
