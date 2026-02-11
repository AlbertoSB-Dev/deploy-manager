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

async function setupNginxProxy() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    const server = await Server.findById(project.serverId);
    
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypt(server.password),
      port: server.port || 22
    });
    
    console.log('✅ Conectado ao servidor\n');
    
    // 1. Instalar Nginx se não estiver instalado
    console.log('📦 Instalando Nginx...');
    await ssh.execCommand('apt-get update && apt-get install -y nginx');
    console.log('✅ Nginx instalado\n');
    
    // 2. Obter nome do container
    console.log('🔍 Obtendo nome do container...');
    const nameResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{.Name}}'`);
    const containerName = nameResult.stdout.trim().replace('/', '');
    console.log(`Nome do container: ${containerName}\n`);
    
    if (!containerName) {
      console.log('❌ Container não encontrado.');
      process.exit(1);
    }
    
    // 3. Criar configuração do Nginx
    console.log('📝 Criando configuração do Nginx...');
    const nginxConfig = `server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${containerName}:${project.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}`;
    
    await ssh.execCommand(`cat > /etc/nginx/sites-available/${project.name} << 'EOF'
${nginxConfig}
EOF`);
    
    // 4. Ativar site
    console.log('🔗 Ativando site...');
    await ssh.execCommand(`ln -sf /etc/nginx/sites-available/${project.name} /etc/nginx/sites-enabled/${project.name}`);
    
    // 5. Testar configuração
    console.log('🧪 Testando configuração...');
    const testResult = await ssh.execCommand('nginx -t');
    console.log(testResult.stderr);
    
    if (testResult.code !== 0) {
      console.log('❌ Erro na configuração do Nginx');
      process.exit(1);
    }
    
    // 6. Recarregar Nginx
    console.log('\n🔄 Recarregando Nginx...');
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx recarregado\n');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ NGINX CONFIGURADO COM SUCESSO!');
    console.log('═══════════════════════════════════════');
    console.log(`\n🌐 Teste o domínio: http://${domain}`);
    console.log(`📡 Proxy: ${domain} → ${containerName}:${project.port}\n`);
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupNginxProxy();
