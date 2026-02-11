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

async function stopTraefikStartNginx() {
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
    
    // 1. Parar Traefik
    console.log('🛑 Parando Traefik...');
    await ssh.execCommand('docker stop traefik-proxy 2>/dev/null || true');
    console.log('✅ Traefik parado\n');
    
    // 2. Verificar se Nginx está rodando
    console.log('🔍 Verificando Nginx...');
    const nginxStatus = await ssh.execCommand('systemctl status nginx');
    
    if (nginxStatus.code !== 0) {
      console.log('📦 Iniciando Nginx...');
      await ssh.execCommand('systemctl start nginx');
    } else {
      console.log('🔄 Recarregando Nginx...');
      await ssh.execCommand('systemctl reload nginx');
    }
    
    console.log('✅ Nginx rodando\n');
    
    // 3. Verificar configuração
    console.log('📋 Configuração ativa:');
    const configResult = await ssh.execCommand('cat /etc/nginx/sites-enabled/painel-ark-deploy');
    console.log(configResult.stdout);
    
    // 4. Testar conectividade
    console.log('\n🧪 Testando conectividade...');
    const testResult = await ssh.execCommand('curl -I http://localhost -H "Host: painelarkdeploy.38.242.213.195.sslip.io" 2>&1 | head -n 5');
    console.log(testResult.stdout);
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ CONFIGURAÇÃO CONCLUÍDA!');
    console.log('═══════════════════════════════════════');
    console.log('\n🌐 Teste: http://painelarkdeploy.38.242.213.195.sslip.io');
    console.log('📡 Traefik: PARADO');
    console.log('✅ Nginx: ATIVO\n');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

stopTraefikStartNginx();
