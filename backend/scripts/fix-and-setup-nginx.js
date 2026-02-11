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

async function fixAndSetupNginx() {
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
    
    // 1. Buscar container correto
    console.log('🔍 Buscando container do projeto...');
    const psResult = await ssh.execCommand(`docker ps --filter "name=painel-ark-deploy" --format "{{.ID}}|{{.Names}}" | head -n 1`);
    const [containerId, containerName] = psResult.stdout.trim().split('|');
    
    if (!containerId) {
      console.log('❌ Nenhum container encontrado para o projeto');
      process.exit(1);
    }
    
    console.log(`✅ Container encontrado: ${containerName} (${containerId})\n`);
    
    // 2. Atualizar banco de dados
    console.log('💾 Atualizando banco de dados...');
    const fullIdResult = await ssh.execCommand(`docker inspect ${containerId} --format '{{.Id}}'`);
    const fullContainerId = fullIdResult.stdout.trim();
    
    project.containerId = fullContainerId;
    await project.save();
    console.log(`✅ Container ID atualizado no banco\n`);
    
    // 3. Obter IP do container na rede coolify
    console.log('🔍 Obtendo IP do container...');
    const ipResult = await ssh.execCommand(`docker inspect ${containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}'`);
    const containerIp = ipResult.stdout.trim();
    
    if (!containerIp) {
      console.log('❌ Container não tem IP na rede coolify');
      process.exit(1);
    }
    
    console.log(`✅ IP do container: ${containerIp}\n`);
    
    // 4. Instalar Nginx
    console.log('📦 Instalando Nginx...');
    await ssh.execCommand('apt-get update && apt-get install -y nginx');
    console.log('✅ Nginx instalado\n');
    
    // 5. Criar configuração do Nginx
    console.log('📝 Criando configuração do Nginx...');
    const nginxConfig = `server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${containerIp}:${project.port};
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
    
    // 6. Ativar site
    console.log('🔗 Ativando site...');
    await ssh.execCommand(`ln -sf /etc/nginx/sites-available/${project.name} /etc/nginx/sites-enabled/${project.name}`);
    
    // 7. Testar configuração
    console.log('🧪 Testando configuração...');
    const testResult = await ssh.execCommand('nginx -t');
    console.log(testResult.stderr);
    
    if (testResult.code !== 0) {
      console.log('❌ Erro na configuração do Nginx');
      process.exit(1);
    }
    
    // 8. Recarregar Nginx
    console.log('\n🔄 Recarregando Nginx...');
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx recarregado\n');
    
    console.log('═══════════════════════════════════════');
    console.log('✅ NGINX CONFIGURADO COM SUCESSO!');
    console.log('═══════════════════════════════════════');
    console.log(`\n🌐 Teste o domínio: http://${domain}`);
    console.log(`📡 Proxy: ${domain} → ${containerIp}:${project.port}\n`);
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixAndSetupNginx();
