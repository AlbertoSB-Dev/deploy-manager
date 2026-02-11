#!/usr/bin/env node

/**
 * Script simples para testar se um domínio está acessível
 * 
 * Uso:
 *   node test-domain.js <domain>
 */

const https = require('https');
const http = require('http');

const domain = process.argv[2] || 'painelark.38.242.213.195.sslip.io';

console.log(`🔍 Testando acesso a: ${domain}\n`);

// Testar HTTP
console.log('📡 Testando HTTP...');
http.get(`http://${domain}`, (res) => {
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  console.log(`📋 Headers:`);
  Object.entries(res.headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📄 Primeiros 500 caracteres da resposta:`);
    console.log(data.substring(0, 500));
  });
}).on('error', (err) => {
  console.log(`❌ Erro HTTP: ${err.message}`);
});

// Testar HTTPS
setTimeout(() => {
  console.log('\n📡 Testando HTTPS...');
  https.get(`https://${domain}`, (res) => {
    console.log(`✅ HTTPS Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.log(`❌ Erro HTTPS: ${err.message} (esperado se não tiver SSL)`);
  });
}, 2000);
