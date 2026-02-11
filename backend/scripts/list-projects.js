// Script para listar todos os projetos do banco de dados

require('dotenv').config();
const mongoose = require('mongoose');

async function listProjects() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    const ProjectSchema = new mongoose.Schema({
      name: String,
      gitUrl: String,
      branch: String,
      status: String,
      containerId: String,
      port: Number
    });
    
    const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

    const projects = await Project.find({});

    if (projects.length === 0) {
      console.log('📭 Nenhum projeto encontrado no banco');
      process.exit(0);
    }

    console.log(`📦 ${projects.length} projeto(s) encontrado(s):\n`);

    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   Git: ${project.gitUrl || 'N/A'}`);
      console.log(`   Branch: ${project.branch || 'N/A'}`);
      console.log(`   Status: ${project.status || 'N/A'}`);
      console.log(`   Porta: ${project.port || 'N/A'}`);
      console.log(`   Container: ${project.containerId ? project.containerId.substring(0, 12) + '...' : 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

listProjects();
