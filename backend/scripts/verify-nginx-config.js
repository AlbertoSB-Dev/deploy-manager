#!/usr/bin/env node

/**
 * Script para verificar configurações do Nginx e status dos containers
 * 
 * Uso:
 *   node verify-nginx-config.js [project-name]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');

async function main() {
  const projectName = process.argv[2];
  
  console.log('🔍 Verificando configurações do Nginx...\n');
  
  // Conectar ao MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
  console.log('✅ Conectado ao MongoDB\n');
  
  const Server = require('../dist/models/Server').default;
  const Project = require('../dist/models/Project').default;
  
  // Buscar projeto específico ou todos
  const query = projectName ? { name: projectName } : {};
  const projects = await Project.find(query).populate('serverId');
  
  if (projects.length === 0) {
    console.log('❌ Nenhum projeto encontrado');
    process.exit(1);
  }
  
  for (const project of projects) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Projeto: ${project.name}`);
    console.log(`🌐 Domínio: ${project.domain || 'Não configurado'}`);
    console.log(`🔌 Porta: ${project.port || 3000}`);
    console.log(`📦 Container ID: ${project.containerId || 'Nenhum'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    if (!project.serverId) {
      console.log('⚠️  Projeto sem servidor configurado\n');
      continue;
    }
    
    const server = project.serverId;
    console.log(`📡 Servidor: ${server.name} (${server.host})\n`);
    
    try {
      // Conectar via SSH
      const ssh = new NodeSSH();
      await ssh.connect({
        host: server.host,
        username: server.username,
        privateKey: server.privateKey
      });
      
      console.log('✅ Conectado via SSH\n');
      
      // Verificar container
      if (project.containerId) {
        console.log('🐳 Status do Container:');
        console.log('─'.repeat(50));
        
        const containerStatus = await ssh.execCommand(`docker ps -a --filter "id=${project.containerId}" --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Ports}}"`);
        
        if (containerStatus.stdout) {
          const [id, name, status, ports] = containerStatus.stdout.split('|');
          console.log(`  ID: ${id}`);
          console.log(`  Nome: ${name}`);
          console.log(`  Status: ${status}`);
          console.log(`  Portas: ${ports || 'Nenhuma'}`);
          
          // Obter IP do container
          const ipResult = await ssh.execCommand(`docker inspect ${project.containerId} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}: {{$value.IPAddress}}{{println}}{{end}}'`);
          console.log(`  IPs:`);
          ipResult.stdout.split('\n').filter(Boolean).forEach(line => {
            console.log(`    ${line}`);
          });
        } else {
          console.log('  ❌ Container não encontrado!');
        }
        console.log();
      }
      
      // Verificar configuração do Nginx
      if (project.domain) {
        console.log('📝 Configuração do Nginx:');
        console.log('─'.repeat(50));
        
        const configFiles = await ssh.execCommand(`ls -la /etc/nginx/sites-enabled/${project.name}* 2>/dev/null || echo "Nenhuma configuração encontrada"`);
        console.log(configFiles.stdout);
        
        // Ler conteúdo da configuração
        const configContent = await ssh.execCommand(`cat /etc/nginx/sites-enabled/${project.name} 2>/dev/null || echo "Arquivo não existe"`);
        if (!configContent.stdout.includes('não existe')) {
          console.log('\n📄 Conteúdo:');
          console.log(configContent.stdout);
        }
        console.log();
      }
      
      // Verificar todos os containers deste projeto
      console.log('🐳 Todos os containers deste projeto:');
      console.log('─'.repeat(50));
      const allContainers = await ssh.execCommand(`docker ps -a --filter "name=${project.name}-" --format "{{.ID}}|{{.Names}}|{{.Status}}"`);
      if (allContainers.stdout) {
        allContainers.stdout.split('\n').filter(Boolean).forEach(line => {
          const [id, name, status] = line.split('|');
          console.log(`  ${name}: ${status} (${id})`);
        });
      } else {
        console.log('  Nenhum container encontrado');
      }
      console.log();
      
      // Testar acesso ao domínio
      if (project.domain) {
        console.log('🌐 Testando acesso ao domínio:');
        console.log('─'.repeat(50));
        const curlTest = await ssh.execCommand(`curl -I -s http://${project.domain} | head -n 5`);
        console.log(curlTest.stdout || 'Sem resposta');
        console.log();
      }
      
      ssh.dispose();
      
    } catch (error) {
      console.error(`❌ Erro ao verificar projeto ${project.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Verificação concluída!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
