// Script para deletar um projeto específico do banco de dados

require('dotenv').config();
const mongoose = require('mongoose');

const projectName = process.argv[2];

if (!projectName) {
  console.log('❌ Erro: Nome do projeto não fornecido');
  console.log('\nUso: node delete-project.js <nome-do-projeto>');
  console.log('Exemplo: node delete-project.js deploy-manager');
  process.exit(1);
}

async function deleteProject() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Schema do projeto
    const ProjectSchema = new mongoose.Schema({
      name: String,
      gitUrl: String,
      branch: String,
      serverId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
      status: String,
      containerId: String,
      port: Number,
      envVars: Object,
      deployments: Array
    });
    
    const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

    // Buscar projeto
    const project = await Project.findOne({ name: projectName });

    if (!project) {
      console.log(`❌ Projeto "${projectName}" não encontrado no banco`);
      process.exit(1);
    }

    console.log(`\n📦 Projeto encontrado:`);
    console.log(`   Nome: ${project.name}`);
    console.log(`   Git: ${project.gitUrl || 'N/A'}`);
    console.log(`   Status: ${project.status || 'N/A'}`);
    console.log(`   Container: ${project.containerId || 'N/A'}`);

    console.log('\n⚠️  ATENÇÃO: Isso irá deletar o projeto do banco!');
    console.log('⚠️  O container Docker NÃO será removido automaticamente.');
    console.log('\nPressione Ctrl+C para cancelar ou aguarde 3 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Deletar projeto
    await Project.deleteOne({ name: projectName });
    console.log(`✅ Projeto "${projectName}" deletado com sucesso!`);

    if (project.containerId) {
      console.log('\n📝 Para remover o container Docker, execute:');
      console.log(`   docker stop ${project.containerId}`);
      console.log(`   docker rm ${project.containerId}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

deleteProject();
