#!/usr/bin/env node

/**
 * Script para limpar documentação desnecessária
 * Remove arquivos duplicados, obsoletos e temporários
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Lista de arquivos para remover
const filesToRemove = [
  // Duplicados
  'FIX-403-ERROR.md',
  'FIX-CPF-ASSAS-SANDBOX.md',
  'CPF-CNPJ-NAO-APARECE.md',
  'RESUMO-PRODUCAO.md',
  'SUPER-ADMIN-REDESIGN.md',
  
  // Implementações antigas
  'ADMIN-PANELS-IMPLEMENTATION.md',
  'APLICAR-DESCONTOS.md',
  'APLICAR-MIDDLEWARES-TRIAL.md',
  'MIDDLEWARES-APLICADOS.md',
  
  // Resumos temporários
  'RESUMO-IMPLEMENTACAO-DELETE-SERVER.md',
  'RESUMO-SELETOR-AMBIENTE.md',
  'VISUAL-SELETOR-AMBIENTE.md',
  'FORMATACAO-CPF-CNPJ.md',
  'ASSAS-FLUXO-VISUAL.md',
  
  // Revisões e próximos passos
  'REVISAO-SISTEMA-COMPLETA.md',
  'PROXIMOS-PASSOS-ASSINATURAS.md',
  'MELHORIAS-DESIGN.md',
  'INTEGRAÇÕES-SETUP.md',
  
  // Testes e logs
  'TESTE-DELECAO-COMPLETA.md',
  'DELETAR-SERVIDOR-SEGURO.md',
  'LIMPEZA-DADOS-ORFAOS.md',
  'LOGO-PNG-UPDATE.md',
  
  // Fluxos específicos
  'FLUXO-ATUALIZACAO-VERSOES.md',
  'O-QUE-ACONTECE-AO-ATUALIZAR.md',
  'SISTEMA-UPGRADE-DOWNGRADE-IMPLEMENTADO.md',
  
  // Configs antigas
  'GITHUB-TOKEN-SETUP.md'
];

console.log('🧹 Limpando documentação desnecessária...\n');

let removedCount = 0;
let notFoundCount = 0;

filesToRemove.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${file}`);
      removedCount++;
    } catch (error) {
      console.error(`❌ Erro ao remover ${file}:`, error.message);
    }
  } else {
    console.log(`⚠️  Não encontrado: ${file}`);
    notFoundCount++;
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   ✅ Removidos: ${removedCount}`);
console.log(`   ⚠️  Não encontrados: ${notFoundCount}`);
console.log(`   📝 Total processados: ${filesToRemove.length}`);

console.log('\n✨ Limpeza concluída!');
console.log('\n📚 Consulte docs/INDICE-DOCUMENTACAO.md para ver a documentação organizada.');
