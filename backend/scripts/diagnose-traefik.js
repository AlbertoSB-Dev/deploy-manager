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

async function diagnoseTraefik() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    const project = await Project.findOne({ domain });
    const server = await Server.findById(project.serverId);
    
    console.log(`\n📦 Projeto: ${project.name}`);
    console.log(`🆔 Container: ${project.containerId.substring(0, 12)}`);
    console.log(`🔌 Porta: ${project.port}`);
    console.log(`🌐 Domínio: ${domain}\n`);
    
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypt(server.password),
      port: server.port || 22
    });
    
    console.log('✅ Conectado ao servidor\n');
    
    // 1. Verificar labels do container
    console.log('═══════════════════════════════════════');
    console.log('1️⃣  LABELS DO CONTAINER');
    console.log('═══════════════════════════════════════');
    const labelsResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{println}}{{end}}'`);
    console.log(labelsResult.stdout);
    
    // 2. Verificar se Traefik está vendo o container
    console.log('═══════════════════════════════════════');
    console.log('2️⃣  ROUTERS DO TRAEFIK');
    console.log('═══════════════════════════════════════');
    const routersResult = await ssh.execCommand(`docker exec traefik-proxy wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Erro ao buscar routers"`);
    console.log(routersResult.stdout.substring(0, 2000));
    
    // 3. Verificar services do Traefik
    console.log('\n═══════════════════════════════════════');
    console.log('3️⃣  SERVICES DO TRAEFIK');
    console.log('═══════════════════════════════════════');
    const servicesResult = await ssh.execCommand(`docker exec traefik-proxy wget -qO- http://localhost:8080/api/http/services 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Erro ao buscar services"`);
    console.log(servicesResult.stdout.substring(0, 2000));
    
    // 4. Verificar logs do Traefik
    console.log('\n═══════════════════════════════════════');
    console.log('4️⃣  LOGS DO TRAEFIK (últimas 20 linhas)');
    console.log('═══════════════════════════════════════');
    const traefikLogsResult = await ssh.execCommand(`docker logs --tail 20 traefik-proxy 2>&1`);
    console.log(traefikLogsResult.stdout);
    
    // 5. Testar conectividade direta
    console.log('\n═══════════════════════════════════════');
    console.log('5️⃣  TESTE DE CONECTIVIDADE DIRETA');
    console.log('═══════════════════════════════════════');
    const ipResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$value.IPAddress}}{{println}}{{end}}' | head -n 1`);
    const containerIp = ipResult.stdout.trim();
    console.log(`IP do container: ${containerIp}`);
    
    if (containerIp) {
      const curlResult = await ssh.execCommand(`docker exec traefik-proxy wget -qO- --timeout=2 http://${containerIp}:${project.port} 2>&1 | head -c 200`);
      console.log(`Teste wget: ${curlResult.stdout || curlResult.stderr}`);
    }
    
    // 6. Verificar configuração do Traefik
    console.log('\n═══════════════════════════════════════');
    console.log('6️⃣  CONFIGURAÇÃO DO TRAEFIK');
    console.log('═══════════════════════════════════════');
    const traefikConfigResult = await ssh.execCommand(`docker inspect traefik-proxy --format '{{range .Args}}{{println .}}{{end}}'`);
    console.log(traefikConfigResult.stdout);
    
    // 7. Verificar providers do Traefik
    console.log('\n═══════════════════════════════════════');
    console.log('7️⃣  PROVIDERS DO TRAEFIK');
    console.log('═══════════════════════════════════════');
    const providersResult = await ssh.execCommand(`docker exec traefik-proxy wget -qO- http://localhost:8080/api/overview 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Erro"`);
    console.log(providersResult.stdout.substring(0, 1000));
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('═══════════════════════════════════════\n');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

diagnoseTraefik();
