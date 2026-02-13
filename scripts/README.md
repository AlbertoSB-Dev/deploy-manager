# 📜 Scripts do Projeto

## 🚀 Scripts de Deploy e Atualização

### `update-production.sh`
Script principal para atualizar o sistema em produção.

**Modos disponíveis:**
- `fast` - Atualização rápida (apenas git pull e restart)
- `normal` - Atualização padrão (rebuild backend e frontend)
- `clean` - Limpeza completa (remove node_modules e rebuild)
- `ultra-clean` - Limpeza total (remove tudo e rebuild do zero)

**Uso:**
```bash
./scripts/update-production.sh [modo]
```

### `install.sh`
Script de instalação inicial do sistema.

**Uso:**
```bash
./install.sh
```

### `install-one-command.sh`
Instalação em um único comando (para produção).

**Uso:**
```bash
curl -sSL https://raw.githubusercontent.com/seu-repo/deploy-manager/main/install-one-command.sh | bash
```

## 🔧 Scripts de Manutenção

### `diagnose.sh`
Diagnóstico completo do sistema.

**Verifica:**
- Status dos containers
- Logs de erros
- Conectividade de rede
- Configurações

**Uso:**
```bash
./scripts/diagnose.sh
```

### `fix-env.sh`
Corrige problemas com variáveis de ambiente.

**Uso:**
```bash
./scripts/fix-env.sh
```

### `fix-nginx.sh`
Corrige configurações do Nginx.

**Uso:**
```bash
./scripts/fix-nginx.sh
```

### `fix-and-deploy.sh`
Corrige problemas e faz deploy.

**Uso:**
```bash
./scripts/fix-and-deploy.sh
```

## 🐳 Scripts Docker

### `remove-all-containers.sh`
Remove todos os containers, volumes e imagens do projeto.

**⚠️ CUIDADO:** Este script remove TUDO!

**Uso:**
```bash
./scripts/remove-all-containers.sh
```

### `setup-nginx-proxy.sh`
Configura proxy Nginx reverso.

**Uso:**
```bash
./scripts/setup-nginx-proxy.sh
```

## 🔄 Scripts de Atualização Específicos

### `update-frontend.sh`
Atualiza apenas o frontend.

**Uso:**
```bash
./scripts/update-frontend.sh
```

### `update-panel.sh`
Atualiza painéis de controle.

**Uso:**
```bash
./scripts/update-panel.sh
```

### `update-system.sh`
Atualiza sistema operacional e dependências.

**Uso:**
```bash
./scripts/update-system.sh
```

### `update.sh`
Script de atualização genérico.

**Uso:**
```bash
./scripts/update.sh
```

## 🎛️ Scripts de Configuração

### `switch-to-production.sh`
Alterna para modo de produção.

**Uso:**
```bash
./scripts/switch-to-production.sh
```

### `create-panel-version.sh`
Cria nova versão do painel.

**Uso:**
```bash
./scripts/create-panel-version.sh [versao]
```

### `gerar-chaves.js`
Gera chaves de criptografia.

**Uso:**
```bash
node scripts/gerar-chaves.js
```

## 🗄️ Scripts de Banco de Dados

Localizados em `backend/scripts/`:

### Usuários e Permissões
- `create-super-admin-user.js` - Criar super admin
- `make-admin.js` - Tornar usuário admin
- `make-admin-auto.js` - Admin automático
- `make-super-admin.js` - Tornar super admin
- `make-user-super-admin.js` - Promover usuário
- `check-user-role.js` - Verificar role
- `reset-password.js` - Resetar senha

### Planos e Assinaturas
- `seed-plans.js` - Popular planos
- `seed-plans-with-discounts.js` - Planos com desconto
- `reset-plans.js` - Resetar planos
- `final-plans.js` - Planos finais
- `add-discount-tiers.js` - Adicionar descontos

### Projetos e Servidores
- `list-projects.js` - Listar projetos
- `delete-project.js` - Deletar projeto
- `clear-servers.js` - Limpar servidores
- `clean-orphan-databases.js` - Limpar DBs órfãos

### Diagnóstico
- `diagnose-502.sh` - Diagnosticar erro 502
- `quick-diagnose.sh` - Diagnóstico rápido
- `check-user-databases.js` - Verificar DBs de usuário

### Manutenção
- `add-cpf-to-users.js` - Adicionar CPF aos usuários
- `update-user-cpf.js` - Atualizar CPF
- `remove-unique-index.js` - Remover índice único

## 🧹 Scripts de Limpeza

### `clean-docs.js`
Remove documentação desnecessária.

**Uso:**
```bash
node scripts/clean-docs.js
```

## 📋 Ordem Recomendada de Uso

### Primeira Instalação
1. `install.sh` ou `install-one-command.sh`
2. `gerar-chaves.js`
3. `backend/scripts/seed-plans.js`
4. `backend/scripts/create-super-admin-user.js`

### Atualização em Produção
1. `update-production.sh normal`
2. Verificar com `diagnose.sh`
3. Se houver problemas: `fix-and-deploy.sh`

### Manutenção Regular
1. `diagnose.sh` - Verificar saúde do sistema
2. `backend/scripts/clean-orphan-databases.js` - Limpar dados órfãos
3. `update-system.sh` - Atualizar dependências

### Troubleshooting
1. `diagnose.sh` - Identificar problema
2. `fix-env.sh` ou `fix-nginx.sh` - Corrigir configurações
3. `remove-all-containers.sh` - Último recurso (remove tudo)

## ⚠️ Scripts Perigosos

Estes scripts podem causar perda de dados:

- `remove-all-containers.sh` - Remove TUDO
- `backend/scripts/reset-plans.js` - Reseta planos
- `backend/scripts/delete-project.js` - Deleta projetos
- `backend/scripts/clear-servers.js` - Limpa servidores

**Use com cuidado em produção!**

## 🔐 Permissões

Tornar scripts executáveis:

```bash
chmod +x scripts/*.sh
chmod +x backend/scripts/*.sh
```

## 📝 Notas

- Sempre faça backup antes de executar scripts de manutenção
- Teste em ambiente de desenvolvimento primeiro
- Leia o código do script antes de executar
- Verifique logs após execução

## 🆘 Suporte

Se um script falhar:

1. Verifique os logs: `docker-compose logs`
2. Execute `diagnose.sh`
3. Consulte `TROUBLESHOOTING.md`
4. Verifique `docs/INDICE-DOCUMENTACAO.md`
