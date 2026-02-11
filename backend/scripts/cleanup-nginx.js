#!/usr/bin/env node

/**
 * Script para limpar configurações antigas do Nginx e containers órfãos
 * 
 * Uso:
 *   node cleanup-nginx.js [project-name]
 * 
 * Se project-name não for fornecido, limpa TODAS as configurações
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { NodeSSH } = require('node-ssh');

async function main() {
  const projectName = process.argv[2];
  
  console.log('🧹 Iniciando limpeza do Nginx...\n');
  
  // Conectar ao MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deploy-manager');
  console.log('✅ Conectado ao MongoDB\n');
  
  const Server = require('../dist/models/Server').default;
  const Project = require('../dist/models/Project').default;
  
  // Buscar todos os servidores
  const servers = await Server.find();
  
  for (const server of servers) {
    console.log(`\n📡 Servidor: ${server.name} (${server.host})`);
    console.log('─'.repeat(50));
    
    try {
      // Conectar via SSH
      const ssh = new NodeSSH();
      await ssh.connect({
        host: server.host,
        username: server.username,
        privateKey: server.privateKey
      });
      
      console.log('✅ Conectado via SSH');
      
      // Listar configurações do Nginx
      const listResult = await ssh.execCommand('ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nenhuma configuração"');
      console.log('\n📋 Configurações atuais:');
      console.log(listResult.stdout);
      
      if (projectName) {
        // Limpar apenas o projeto específico
        console.log(`\n🗑️  Removendo configurações de: ${projectName}`);
        
        await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/${projectName}*`);
        await ssh.execCommand(`rm -f /etc/nginx/sites-available/${projectName}*`);
        
        // Remover containers antigos deste projeto
        console.log(`\n🐳 Removendo containers antigos de: ${projectName}`);
        const removeResult = await ssh.execCommand(`docker ps -a --filter "name=${projectName}-" --format "{{.ID}} {{.Names}}" | while read id name; do echo "Removendo: $name"; docker rm -f $id; done`);
        if (removeResult.stdout) {
          console.log(removeResult.stdout);
        }
        
      } else {
        // Limpar TODAS as configurações
        console.log('\n🗑️  Removendo TODAS as configurações do Nginx...');
        
        // Buscar todos os projetos deste servidor
        const projects = await Project.find({ serverId: server._id });
        
        for (const project of projects) {
          console.log(`  - Limpando: ${project.name}`);
          await ssh.execCommand(`rm -f /etc/nginx/sites-enabled/${project.name}*`);
          await ssh.execCommand(`rm -f /etc/nginx/sites-available/${project.name}*`);
          
          // Remover containers antigos
          await ssh.execCommand(`docker ps -a --filter "name=${project.name}-" --format "{{.ID}}" | xargs -r docker rm -f`);
        }
      }
      
      // Testar configuração do Nginx
      console.log('\n🔍 Testando configuração do Nginx...');
      const testResult = await ssh.execCommand('nginx -t');
      
      if (testResult.code === 0) {
        console.log('✅ Configuração válida');
        
        // Recarregar Nginx
        console.log('\n🔄 Recarregando Nginx...');
        await ssh.execCommand('systemctl reload nginx');
        console.log('✅ Nginx recarregado');
      } else {
        console.log('❌ Erro na configuração:');
        console.log(testResult.stderr);
      }
      
      // Listar containers rodando
      console.log('\n🐳 Containers rodando:');
      const psResult = await ssh.execCommand('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
      console.log(psResult.stdout);
      
      ssh.dispose();
      
    } catch (error) {
      console.error(`❌ Erro ao processar servidor ${server.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Limpeza concluída!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
