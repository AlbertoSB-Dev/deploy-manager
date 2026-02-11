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

async function checkContainer() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    const server = await Server.findById(project.serverId);
    
    console.log(`📦 Projeto: ${project.name}`);
    console.log(`🆔 Container ID no banco: ${project.containerId}\n`);
    
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypt(server.password),
      port: server.port || 22
    });
    
    console.log('✅ Conectado ao servidor\n');
    
    // Listar todos os containers
    console.log('📋 Containers rodando:');
    const psResult = await ssh.execCommand('docker ps --format "{{.ID}} | {{.Names}} | {{.Status}}"');
    console.log(psResult.stdout);
    
    // Verificar se o container do projeto existe
    console.log(`\n🔍 Verificando container ${project.containerId.substring(0, 12)}...`);
    const inspectResult = await ssh.execCommand(`docker inspect ${project.containerId} 2>&1`);
    
    if (inspectResult.code !== 0) {
      console.log('❌ Container não encontrado!');
      console.log('\n💡 Execute: node scripts/fix-container-labels.js');
      console.log('   para recriar o container');
    } else {
      console.log('✅ Container encontrado');
      
      // Obter status
      const statusResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{.State.Status}}'`);
      console.log(`Status: ${statusResult.stdout}`);
      
      // Obter IP
      const ipResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}: {{$value.IPAddress}}{{println}}{{end}}'`);
      console.log(`\nRedes e IPs:\n${ipResult.stdout}`);
    }
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkContainer();
