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

async function reinstallTraefik() {
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
    
    // 1. Parar e remover Traefik antigo
    console.log('🛑 Parando Traefik antigo...');
    await ssh.execCommand('docker stop traefik-proxy 2>/dev/null || true');
    await ssh.execCommand('docker rm traefik-proxy 2>/dev/null || true');
    console.log('✅ Traefik antigo removido\n');
    
    // 2. Instalar Traefik novo com configuração correta
    console.log('📦 Instalando Traefik atualizado...');
    
    const installCommand = `docker run -d \\
  --name traefik-proxy \\
  --restart unless-stopped \\
  --network coolify \\
  -p 80:80 \\
  -p 443:443 \\
  -p 8080:8080 \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  traefik:v2.5 \\
  --api.insecure=true \\
  --providers.docker=true \\
  --providers.docker.exposedbydefault=false \\
  --providers.docker.network=coolify \\
  --entrypoints.web.address=:80 \\
  --entrypoints.websecure.address=:443 \\
  --log.level=INFO`;
    
    const installResult = await ssh.execCommand(installCommand);
    
    if (installResult.code !== 0) {
      console.log('❌ Erro ao instalar Traefik:', installResult.stderr);
      process.exit(1);
    }
    
    console.log('✅ Traefik instalado com sucesso!\n');
    
    // 3. Aguardar Traefik iniciar
    console.log('⏳ Aguardando Traefik iniciar...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Verificar se está rodando
    const checkResult = await ssh.execCommand('docker ps --filter "name=traefik-proxy" --format "{{.Status}}"');
    console.log(`Status: ${checkResult.stdout}\n`);
    
    // 5. Verificar logs
    console.log('📋 Logs do Traefik:');
    const logsResult = await ssh.execCommand('docker logs --tail 10 traefik-proxy 2>&1');
    console.log(logsResult.stdout);
    
    console.log('\n✅ Traefik reinstalado com sucesso!');
    console.log('\n💡 Agora execute: node scripts/fix-container-labels.js');
    console.log('   para recriar o container do projeto com os labels corretos');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

reinstallTraefik();
