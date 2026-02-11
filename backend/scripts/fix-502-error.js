#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir erro 502 Bad Gateway
 * 
 * Uso:
 *   node fix-502-error.js <project-name>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');

async function main() {
  const projectName = process.argv[2];
  
  if (!projectName) {
    console.log('❌ Uso: node fix-502-error.js <project-name>');
    process.exit(1);
  }
  
  console.log(`🔧 Corrigindo erro 502 para: ${projectName}\n`);
  
  // Conectar ao MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
  
  const Project = require('../dist/models/Project').default;
  const project = await Project.findOne({ name: projectName }).populate('serverId');
  
  if (!project) {
    console.log(`❌ Projeto "${projectName}" não encontrado`);
    process.exit(1);
  }
  
  const server = project.serverId;
  console.log(`📡 Conectando ao servidor ${server.host}...\n`);
  
  const ssh = new NodeSSH();
  await ssh.connect({
    host: server.host,
    username: server.username,
    privateKey: server.privateKey
  });
  
  console.log('✅ Conectado\n');
  
  // 1. Verificar container
  console.log('🔍 PASSO 1: Verificando container...');
  console.log('─'.repeat(60));
  
  if (!project.containerId) {
    console.log('❌ Nenhum container ID registrado no banco de dados');
    console.log('💡 Solução: Faça um novo deploy do projeto\n');
    process.exit(1);
  }
  
  const containerCheck = await ssh.execCommand(`docker ps -a --filter "id=${project.containerId}" --format "{{.ID}}|{{.Names}}|{{.Status}}"`);
  
  if (!containerCheck.stdout) {
    console.log('❌ Container não existe mais no servidor');
    console.log('💡 Solução: Faça um novo deploy do projeto\n');
    process.exit(1);
  }
  
  const [id, name, status] = containerCheck.stdout.split('|');
  console.log(`Container: ${name}`);
  console.log(`Status: ${status}\n`);
  
  if (!status.includes('Up')) {
    console.log('⚠️  Container não está rodando!');
    console.log('📋 Verificando logs do container...\n');
    
    const logs = await ssh.execCommand(`docker logs --tail 50 ${project.containerId}`);
    console.log('Últimas 50 linhas dos logs:');
    console.log('─'.repeat(60));
    console.log(logs.stdout || logs.stderr);
    console.log('─'.repeat(60));
    console.log();
    
    console.log('🔄 Tentando iniciar o container...');
    const startResult = await ssh.execCommand(`docker start ${project.containerId}`);
    
    if (startResult.code === 0) {
      console.log('✅ Container iniciado com sucesso!');
      
      // Aguardar 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se está rodando
      const checkAgain = await ssh.execCommand(`docker ps --filter "id=${project.containerId}" --format "{{.Status}}"`);
      if (checkAgain.stdout.includes('Up')) {
        console.log('✅ Container está rodando agora!');
      } else {
        console.log('❌ Container não conseguiu iniciar. Verificando logs...');
        const errorLogs = await ssh.execCommand(`docker logs --tail 20 ${project.containerId}`);
        console.log(errorLogs.stdout || errorLogs.stderr);
      }
    } else {
      console.log('❌ Erro ao iniciar container:', startResult.stderr);
      console.log('💡 Solução: Faça um novo deploy do projeto');
    }
    console.log();
  } else {
    console.log('✅ Container está rodando\n');
  }
  
  // 2. Verificar conectividade
  console.log('🔍 PASSO 2: Verificando conectividade...');
  console.log('─'.repeat(60));
  
  const ipResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}'`);
  const containerIp = ipResult.stdout.trim();
  
  if (!containerIp) {
    console.log('❌ Container não tem IP na rede coolify');
    console.log('💡 Solução: Reconectar container à rede coolify\n');
    
    await ssh.execCommand(`docker network connect coolify ${project.containerId}`);
    console.log('✅ Container reconectado à rede coolify');
    
    const newIpResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{if eq $key "coolify"}}{{$value.IPAddress}}{{end}}{{end}}'`);
    const newIp = newIpResult.stdout.trim();
    console.log(`📡 Novo IP: ${newIp}\n`);
  } else {
    console.log(`📡 IP do container: ${containerIp}`);
    
    // Testar conectividade
    console.log(`🔌 Testando conectividade para ${containerIp}:${project.port || 3000}...`);
    const curlTest = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" http://${containerIp}:${project.port || 3000} --max-time 5 || echo "TIMEOUT"`);
    const httpCode = curlTest.stdout.trim();
    
    if (httpCode === 'TIMEOUT' || httpCode === '000') {
      console.log('❌ Container não está respondendo na porta configurada');
      console.log('📋 Verificando se a aplicação está escutando...\n');
      
      const portCheck = await ssh.execCommand(`docker exec ${project.containerId} netstat -tlnp 2>/dev/null || docker exec ${project.containerId} ss -tlnp 2>/dev/null || echo "Comando não disponível"`);
      console.log('Portas escutando no container:');
      console.log(portCheck.stdout);
      console.log();
      
      console.log('📋 Logs recentes do container:');
      const recentLogs = await ssh.execCommand(`docker logs --tail 30 ${project.containerId}`);
      console.log(recentLogs.stdout || recentLogs.stderr);
      console.log();
      
      console.log('💡 Possíveis problemas:');
      console.log('   1. A aplicação não está escutando na porta correta');
      console.log('   2. A aplicação falhou ao iniciar');
      console.log('   3. A variável de ambiente PORT não está sendo usada');
      console.log('   4. O Dockerfile não está configurado corretamente');
      console.log();
      console.log('💡 Solução: Verifique o Dockerfile e as variáveis de ambiente');
    } else {
      console.log(`✅ Container respondendo com HTTP ${httpCode}\n`);
    }
  }
  
  // 3. Verificar configuração do Nginx
  console.log('🔍 PASSO 3: Verificando Nginx...');
  console.log('─'.repeat(60));
  
  const nginxConfig = await ssh.execCommand(`cat /etc/nginx/sites-enabled/${project.name} 2>/dev/null || echo "Configuração não encontrada"`);
  
  if (nginxConfig.stdout.includes('não encontrada')) {
    console.log('❌ Configuração do Nginx não existe');
    console.log('💡 Solução: Reconfigurar proxy reverso\n');
    
    // Reconfigurar Nginx
    const NginxService = require('../dist/services/NginxService').NginxService;
    await NginxService.configureProxy(ssh, project.name, project.domain, name, project.port || 3000);
    console.log('✅ Nginx reconfigurado\n');
  } else {
    console.log('✅ Configuração do Nginx existe');
    console.log('\nConteúdo:');
    console.log(nginxConfig.stdout);
    console.log();
    
    // Verificar se o IP está correto
    if (containerIp && !nginxConfig.stdout.includes(containerIp)) {
      console.log(`⚠️  Configuração do Nginx tem IP desatualizado!`);
      console.log(`💡 Atualizando para ${containerIp}...\n`);
      
      const NginxService = require('../dist/services/NginxService').NginxService;
      await NginxService.updateProxy(ssh, project.name, project.domain, name, project.port || 3000);
      console.log('✅ Nginx atualizado\n');
    }
  }
  
  // 4. Testar acesso
  console.log('🔍 PASSO 4: Testando acesso final...');
  console.log('─'.repeat(60));
  
  const finalTest = await ssh.execCommand(`curl -I -s http://localhost -H "Host: ${project.domain}" --max-time 5 | head -n 5`);
  console.log(finalTest.stdout);
  console.log();
  
  if (finalTest.stdout.includes('502')) {
    console.log('❌ Ainda retornando 502');
    console.log('💡 Recomendação: Faça um novo deploy do projeto');
  } else if (finalTest.stdout.includes('200') || finalTest.stdout.includes('301') || finalTest.stdout.includes('302')) {
    console.log('✅ Projeto está acessível!');
    console.log(`🌐 Acesse: http://${project.domain}`);
  }
  
  ssh.dispose();
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
