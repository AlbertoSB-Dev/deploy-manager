require('dotenv').config();

console.log('\n🔍 Verificando configuração do GitHub OAuth...\n');

const config = {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
};

let allConfigured = true;

Object.entries(config).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = value ? (key === 'GITHUB_CLIENT_SECRET' ? '***' + value.slice(-4) : value) : 'NÃO CONFIGURADO';
  console.log(`${status} ${key}: ${display}`);
  
  if (!value) {
    allConfigured = false;
  }
});

console.log('\n');

if (allConfigured) {
  console.log('✅ Todas as variáveis estão configuradas!');
  console.log('\n📝 Próximo passo: Reinicie o backend com "npm run dev"\n');
} else {
  console.log('❌ Algumas variáveis não estão configuradas!');
  console.log('\n📝 Siga os passos:');
  console.log('1. Crie um OAuth App no GitHub: https://github.com/settings/developers');
  console.log('2. Edite o arquivo backend/.env');
  console.log('3. Adicione as credenciais do GitHub');
  console.log('4. Execute este script novamente: node check-github-config.js\n');
}
