const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');
require('dotenv').config();

async function fixTraefikDomain() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
    
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const Server = mongoose.model('Server', new mongoose.Schema({}, { strict: false }));
    
    // Buscar projeto pelo domínio
    const domain = 'painelarkdeploy.38.242.213.195.sslip.io';
    console.log(`🔍 Buscando projeto com domínio: ${domain}`);
    
    const project = await Project.findOne({ domain });
    if (!project) {
      console.log('❌ Projeto não encontrado');
      process.exit(1);
    }
    
    console.log(`✅ Projeto encontrado: ${project.name}`);
    console.log(`📦 Container ID: ${project.containerId}`);
    console.log(`🌐 Servidor: ${project.serverName}`);
    
    if (!project.serverId) {
      console.log('❌ Projeto não está em servidor remoto');
      process.exit(1);
    }
    
    const server = await Server.findById(project.serverId);
    if (!server) {
      console.log('❌ Servidor não encontrado');
      process.exit(1);
    }
    
    console.log(`\n🔐 Conectando ao servidor ${server.host}...`);
    const ssh = new NodeSSH();
    
    // Descriptografar senha usando a mesma função do modelo
    const crypto = require('crypto');
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
    
    const decrypted = decrypt(server.password);
    
    await ssh.connect({
      host: server.host,
      username: server.username,
      password: decrypted,
      port: server.port || 22
    });
    
    console.log('✅ Conectado ao servidor\n');
    
    // 1. Verificar se container está rodando
    console.log('🔍 Verificando container...');
    const containerCheck = await ssh.execCommand(`docker ps --filter "id=${project.containerId}" --format "{{.Status}}"`);
    if (!containerCheck.stdout.includes('Up')) {
      console.log('❌ Container não está rodando!');
      console.log('Iniciando container...');
      await ssh.execCommand(`docker start ${project.containerId}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('✅ Container rodando');
    }
    
    // 2. Verificar labels do Traefik
    console.log('\n🔍 Verificando labels do Traefik...');
    const labelsCheck = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .Config.Labels}}{{$key}}={{$value}}{{println}}{{end}}'`);
    console.log('Labels atuais:');
    console.log(labelsCheck.stdout);
    
    const hasTraefikEnable = labelsCheck.stdout.includes('traefik.enable=true');
    if (!hasTraefikEnable) {
      console.log('\n❌ Container não tem labels do Traefik!');
      console.log('⚠️  É necessário recriar o container com labels corretos.');
      console.log('\n💡 Solução: Faça um novo deploy do projeto no painel.');
      ssh.dispose();
      process.exit(1);
    }
    
    console.log('✅ Labels do Traefik encontrados');
    
    // 3. Verificar rede do Traefik
    console.log('\n🔍 Verificando redes...');
    const traefikNetworkResult = await ssh.execCommand(`docker inspect traefik-proxy --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}' | head -n 1`);
    const traefikNetwork = traefikNetworkResult.stdout.trim();
    console.log(`Rede do Traefik: ${traefikNetwork}`);
    
    const containerNetworkResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{println}}{{end}}'`);
    const containerNetworks = containerNetworkResult.stdout.trim().split('\n');
    console.log(`Redes do container: ${containerNetworks.join(', ')}`);
    
    if (!containerNetworks.includes(traefikNetwork)) {
      console.log(`\n⚠️  Container não está na rede do Traefik!`);
      console.log(`🔧 Conectando à rede ${traefikNetwork}...`);
      await ssh.execCommand(`docker network connect ${traefikNetwork} ${project.containerId}`);
      console.log('✅ Container conectado à rede do Traefik');
    } else {
      console.log('✅ Container já está na rede do Traefik');
    }
    
    // 4. Verificar porta interna
    console.log('\n🔍 Verificando porta da aplicação...');
    const portCheck = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .Config.Labels}}{{if eq $key "traefik.http.services.${project.name}.loadbalancer.server.port"}}{{$value}}{{end}}{{end}}'`);
    const configuredPort = portCheck.stdout.trim();
    console.log(`Porta configurada no Traefik: ${configuredPort || 'NÃO ENCONTRADA'}`);
    console.log(`Porta esperada: ${project.port || 3000}`);
    
    // 5. Testar conectividade interna
    console.log('\n🔍 Testando conectividade interna...');
    const containerIpResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "${traefikNetwork}"}}{{$value.IPAddress}}{{end}}{{end}}'`);
    const containerIp = containerIpResult.stdout.trim();
    
    if (containerIp) {
      console.log(`IP do container: ${containerIp}`);
      const testPort = project.port || 3000;
      const testResult = await ssh.execCommand(`docker exec traefik-proxy wget -q -O- --timeout=2 http://${containerIp}:${testPort} 2>&1 | head -c 100`);
      if (testResult.stdout.trim()) {
        console.log('✅ Aplicação respondendo internamente');
        console.log(`Resposta: ${testResult.stdout.substring(0, 100)}...`);
      } else {
        console.log('❌ Aplicação NÃO está respondendo internamente');
        console.log('Verificando logs do container...');
        const logsResult = await ssh.execCommand(`docker logs --tail 20 ${project.containerId}`);
        console.log('\nÚltimas 20 linhas do log:');
        console.log(logsResult.stdout || logsResult.stderr);
      }
    }
    
    // 6. Reiniciar Traefik para forçar detecção
    console.log('\n🔄 Reiniciando Traefik...');
    await ssh.execCommand('docker restart traefik-proxy');
    console.log('✅ Traefik reiniciado');
    
    // 7. Verificar rotas do Traefik
    console.log('\n🔍 Verificando rotas do Traefik...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const routesResult = await ssh.execCommand(`docker exec traefik-proxy wget -q -O- http://localhost:8080/api/http/routers 2>/dev/null | grep -o '"rule":"[^"]*"' | head -10`);
    console.log('Rotas detectadas pelo Traefik:');
    console.log(routesResult.stdout || 'Nenhuma rota encontrada');
    
    console.log('\n✅ Diagnóstico concluído!');
    console.log(`\n🌐 Teste o domínio: http://${domain}`);
    console.log('⏳ Aguarde 5-10 segundos para o Traefik detectar as mudanças');
    
    ssh.dispose();
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixTraefikDomain();
