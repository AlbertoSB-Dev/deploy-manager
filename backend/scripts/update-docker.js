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

async function updateDocker() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    const server = await Server.findOne({ host: '38.242.213.195' });
    
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypt(server.password),
      port: server.port || 22
    });
    
    console.log('✅ Conectado ao servidor\n');
    
    // Verificar versão atual do Docker
    console.log('🔍 Verificando versão atual do Docker...');
    const versionResult = await ssh.execCommand('docker version --format "{{.Server.Version}}"');
    console.log(`Versão atual: ${versionResult.stdout}\n`);
    
    // Atualizar Docker
    console.log('📦 Atualizando Docker...');
    console.log('Isso pode levar alguns minutos...\n');
    
    const updateCommands = `
      # Atualizar repositórios
      apt-get update
      
      # Instalar dependências
      apt-get install -y ca-certificates curl gnupg lsb-release
      
      # Adicionar chave GPG do Docker
      mkdir -p /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      
      # Adicionar repositório do Docker
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      
      # Atualizar novamente
      apt-get update
      
      # Atualizar Docker
      apt-get install -y --only-upgrade docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    `;
    
    const updateResult = await ssh.execCommand(updateCommands, {
      onStdout: (chunk) => {
        process.stdout.write(chunk.toString('utf8'));
      },
      onStderr: (chunk) => {
        process.stderr.write(chunk.toString('utf8'));
      }
    });
    
    if (updateResult.code !== 0) {
      console.log('\n❌ Erro ao atualizar Docker');
      console.log(updateResult.stderr);
      process.exit(1);
    }
    
    console.log('\n✅ Docker atualizado!\n');
    
    // Verificar nova versão
    console.log('🔍 Verificando nova versão...');
    const newVersionResult = await ssh.execCommand('docker version --format "{{.Server.Version}}"');
    console.log(`Nova versão: ${newVersionResult.stdout}\n`);
    
    // Verificar API version
    const apiResult = await ssh.execCommand('docker version --format "{{.Server.APIVersion}}"');
    console.log(`API Version: ${apiResult.stdout}\n`);
    
    console.log('✅ Atualização concluída!');
    console.log('\n💡 Agora execute: node scripts/reinstall-traefik.js');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

updateDocker();
