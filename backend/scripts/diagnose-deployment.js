#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de deployment e proxy
 * 
 * Uso:
 *   node diagnose-deployment.js <project-name>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');

async function main() {
  const projectName = process.argv[2];
  
  if (!projectName) {
    console.log('❌ Uso: node diagnose-deployment.js <project-name>');
    process.exit(1);
  }
  
  console.log(`🔍 Diagnosticando deployment: ${projectName}\n`);
  
  // Conectar ao MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
  console.log('✅ Conectado ao MongoDB\n');
  
  const Project = require('../dist/models/Project').default;
  const Server = require('../dist/models/Server').default;
  
  // Buscar projeto
  const project = await Project.findOne({ name: projectName }).populate('serverId');
  
  if (!project) {
    console.log(`❌ Projeto "${projectName}" não encontrado`);
    process.exit(1);
  }
  
  console.log('📦 INFORMAÇÕES DO PROJETO');
  console.log('═'.repeat(60));
  console.log(`Nome: ${project.name}`);
  console.log(`Domínio: ${project.domain || 'Não configurado'}`);
  console.log(`Porta: ${project.port || 3000}`);
  console.log(`Container ID: ${project.containerId || 'Nenhum'}`);
  console.log(`Status: ${project.status}`);
  console.log(`Branch: ${project.branch}`);
  console.log();
  
  if (!project.serverId) {
    console.log('❌ Projeto sem servidor configurado');
    process.exit(1);
  }
  
  const server = project.serverId;
  console.log('🖥️  SERVIDOR');
  console.log('═'.repeat(60));
  console.log(`Nome: ${server.name}`);
  console.log(`Host: ${server.host}`);
  console.log();
  
  try {
    // Conectar via SSH
    const ssh = new NodeSSH();
    await ssh.connect({
      host: server.host,
      username: server.username,
      privateKey: server.privateKey
    });
    
    console.log('✅ Conectado via SSH\n');
    
    // 1. Verificar container
    console.log('🐳 STATUS DO CONTAINER');
    console.log('═'.repeat(60));
    
    if (project.containerId) {
      const containerInfo = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{json .}}'`);
      
      if (containerInfo.code === 0) {
        const info = JSON.parse(containerInfo.stdout);
        const state = info.State;
        const networks = info.NetworkSettings.Networks;
        
        console.log(`ID: ${info.Id.substring(0, 12)}`);
        console.log(`Nome: ${info.Name.replace('/', '')}`);
        console.log(`Status: ${state.Status}`);
        console.log(`Running: ${state.Running ? '✅ Sim' : '❌ Não'}`);
        console.log(`Started At: ${state.StartedAt}`);
        
        if (state.Error) {
          console.log(`Erro: ${state.Error}`);
        }
        
        console.log('\n📡 Redes:');
        for (const [networkName, networkInfo] of Object.entries(networks)) {
          console.log(`  ${networkName}: ${networkInfo.IPAddress}`);
        }
        
        // Testar conectividade interna
        console.log('\n🔌 Testando conectividade interna:');
        const curlTest = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" http://${networks.coolify?.IPAddress || Object.values(networks)[0].IPAddress}:${project.port || 3000} --max-time 5 || echo "FALHOU"`);
        const httpCode = curlTest.stdout.trim();
        
        if (httpCode === 'FALHOU') {
          console.log(`  ❌ Container não está respondendo na porta ${project.port || 3000}`);
          
          // Verificar logs do container
          console.log('\n📋 Últimas 20 linhas dos logs do container:');
          const logs = await ssh.execCommand(`docker logs --tail 20 ${project.containerId}`);
          console.log(logs.stdout || logs.stderr);
        } else {
          console.log(`  ✅ Container respondendo com HTTP ${httpCode}`);
        }
      } else {
        console.log('❌ Container não encontrado!');
      }
    } else {
      console.log('❌ Nenhum container configurado');
    }
    
    console.log();
    
    // 2. Verificar Nginx
    console.log('🌐 CONFIGURAÇÃO DO NGINX');
    console.log('═'.repeat(60));
    
    const nginxStatus = await ssh.execCommand('systemctl status nginx');
    console.log(`Status: ${nginxStatus.code === 0 ? '✅ Rodando' : '❌ Parado'}`);
    
    // Verificar se está escutando na porta 80
    const port80 = await ssh.execCommand('netstat -tlnp | grep :80 || ss -tlnp | grep :80');
    console.log(`Porta 80: ${port80.stdout ? '✅ Escutando' : '❌ Não escutando'}`);
    
    // Verificar configuração do projeto
    const configExists = await ssh.execCommand(`test -f /etc/nginx/sites-enabled/${project.name} && echo "exists" || echo "missing"`);
    
    if (configExists.stdout.trim() === 'exists') {
      console.log(`Configuração: ✅ Existe`);
      
      console.log('\n📄 Conteúdo da configuração:');
      const configContent = await ssh.execCommand(`cat /etc/nginx/sites-enabled/${project.name}`);
      console.log(configContent.stdout);
      
      // Testar configuração
      const nginxTest = await ssh.execCommand('nginx -t 2>&1');
      console.log(`\nTeste de configuração: ${nginxTest.code === 0 ? '✅ Válida' : '❌ Inválida'}`);
      if (nginxTest.code !== 0) {
        console.log(nginxTest.stdout);
      }
    } else {
      console.log(`Configuração: ❌ Não existe`);
    }
    
    console.log();
    
    // 3. Testar acesso externo
    if (project.domain) {
      console.log('🌍 TESTE DE ACESSO EXTERNO');
      console.log('═'.repeat(60));
      
      // Testar do próprio servidor
      console.log('Testando do servidor (localhost):');
      const localhostTest = await ssh.execCommand(`curl -I -s http://localhost -H "Host: ${project.domain}" --max-time 5 | head -n 10`);
      console.log(localhostTest.stdout || '❌ Sem resposta');
      
      console.log('\nTestando pelo domínio:');
      const domainTest = await ssh.execCommand(`curl -I -s http://${project.domain} --max-time 5 | head -n 10`);
      console.log(domainTest.stdout || '❌ Sem resposta');
    }
    
    console.log();
    
    // 4. Verificar firewall
    console.log('🔥 FIREWALL');
    console.log('═'.repeat(60));
    
    const ufwStatus = await ssh.execCommand('ufw status 2>/dev/null || echo "UFW não instalado"');
    console.log(ufwStatus.stdout);
    
    const iptables = await ssh.execCommand('iptables -L INPUT -n | grep -E "80|443" || echo "Nenhuma regra específica"');
    console.log('\nRegras iptables para portas 80/443:');
    console.log(iptables.stdout);
    
    console.log();
    
    // 5. Verificar DNS
    if (project.domain) {
      console.log('🔍 RESOLUÇÃO DNS');
      console.log('═'.repeat(60));
      
      const dnsTest = await ssh.execCommand(`nslookup ${project.domain} || dig ${project.domain} +short`);
      console.log(dnsTest.stdout);
    }
    
    ssh.dispose();
    
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
  }
  
  console.log('\n✅ Diagnóstico concluído!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
