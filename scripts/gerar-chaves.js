#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔐 Gerador de Chaves Seguras para Ark Deploy\n');
console.log('═'.repeat(60));

// JWT Secret (64 bytes = 128 caracteres hex)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_SECRET (copie e cole no painel):');
console.log('─'.repeat(60));
console.log(jwtSecret);

// Encryption Key (16 bytes = 32 caracteres hex)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('\n🔒 ENCRYPTION_KEY (copie e cole no painel):');
console.log('─'.repeat(60));
console.log(encryptionKey);

console.log('\n⚠️  IMPORTANTE:');
console.log('   • Guarde estas chaves em local seguro');
console.log('   • NUNCA mude o ENCRYPTION_KEY depois de configurado');
console.log('   • Use chaves diferentes para desenvolvimento e produção');

console.log('\n═'.repeat(60));
console.log('✅ Chaves geradas com sucesso!\n');
