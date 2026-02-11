const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');
const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function decrypt(text) {
  if (!text) return '';
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function fixContainerLabels() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    const server = await Server.findById(project.serverId);
    
    console.log(`🔐 Conectando ao servidor ${server.host}...`);
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypt(server.password),
      port: server.port || 22
    });
    
    console.log('✅ Conectado\n');
    
    // Verificar logs do container
    console.log('📋 Logs do container (últimas 30 linhas):');
    const logsResult = await ssh.execCommand(`docker logs --tail 30 ${project.containerId}`);
    console.log(logsResult.stdout || logsResult.stderr);
    
    // Verificar se aplicação está escutando na porta correta
    console.log('\n🔍 Verificando processos no container...');
    const processResult = await ssh.execCommand(`docker exec ${project.containerId} sh -c "netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || echo 'netstat não disponível'"`);
    console.log(processResult.stdout);
    
    // Parar container
    console.log('\n⏸️  Parando container...');
    await ssh.execCommand(`docker stop ${project.containerId}`);
    
    // Remover container
    console.log('🗑️  Removendo container...');
    await ssh.execCommand(`docker rm ${project.containerId}`);
    
    // Recriar container com labels corretos
    console.log('🚀 Recriando container com labels corretos...');
    
    const projectName = project.name.replace(/[^a-z0-9-]/g, '');
    const port = project.port || 3000;
    
    const labels = [
      '--label "traefik.enable=true"',
      '--label "traefik.docker.network=coolify"',
      `--label "traefik.http.routers.${projectName}.rule=Host(\\\`${domain}\\\`)"`,
      `--label "traefik.http.routers.${projectName}.entrypoints=web"`,
      `--label "traefik.http.services.${projectName}.loadbalancer.server.port=${port}"`
    ].join(' ');
    
    // Buscar imagem mais recente
    const imageResult = await ssh.execCommand(`docker images ${project.name} --format "{{.Repository}}:{{.Tag}}" | head -n 1`);
    const image = imageResult.stdout.trim();
    
    console.log(`📦 Usando imagem: ${image}`);
    console.log(`🏷️  Labels: ${labels}`);
    
    const containerName = `${project.name}-${Date.now()}`;
    const runCommand = `docker run -d --name ${containerName} --network coolify -e PORT=${port} ${labels} --restart unless-stopped ${image}`;
    
    console.log(`\n🔧 Comando: ${runCommand}\n`);
    
    const runResult = await ssh.execCommand(runCommand);
    
    if (runResult.code !== 0) {
      console.log('❌ Erro ao criar container:', runResult.stderr);
      ssh.dispose();
      process.exit(1);
    }
    
    const newContainerId = runResult.stdout.trim();
    console.log(`✅ Container criado: ${newContainerId.substring(0, 12)}`);
    
    // Atualizar projeto no banco
    project.containerId = newContainerId;
    await project.save();
    console.log('✅ Projeto atualizado no banco');
    
    // Aguardar container iniciar
    console.log('\n⏳ Aguardando container iniciar...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar logs
    console.log('\n📋 Logs do novo container:');
    const newLogsResult = await ssh.execCommand(`docker logs --tail 20 ${newContainerId}`);
    console.log(newLogsResult.stdout || newLogsResult.stderr);
    
    // Reiniciar Traefik
    console.log('\n🔄 Reiniciando Traefik...');
    await ssh.execCommand('docker restart traefik-proxy');
    
    console.log('\n✅ Correção concluída!');
    console.log(`🌐 Teste: http://${domain}`);
    console.log('⏳ Aguarde 10 segundos para o Traefik detectar');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixContainerLabels();
