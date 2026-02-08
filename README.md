# 🚀 Deploy Manager

Sistema de gerenciamento de deploy multi-projeto estilo Coolify. Gerencie múltiplos projetos, versões Git, e faça deploy/rollback facilmente através de um painel web.

> **🎯 [COMECE AQUI](./START-HERE.md)** - Instalação em 30 segundos

---

## ✨ Funcionalidades

### 🆕 Novidades v1.1.0

- 🎉 **Logs de Deploy em Tempo Real** - Veja cada etapa do deploy acontecendo via WebSocket
- 🌐 **Domínios Automáticos** - Sistema gera domínios de teste automaticamente (ex: `meu-app.localhost`)
- 🔗 **Links Clicáveis** - Clique no domínio do projeto para abrir em nova aba
- 🏷️ **Badge "Teste"** - Identifique facilmente domínios de desenvolvimento
- 📡 **Indicador de Conexão** - Veja status da conexão WebSocket em tempo real

### Core Features

- ✅ **Deploy com Docker** - Cada projeto roda em seu próprio container isolado
- ✅ **Gerenciar múltiplos projetos** em um único painel
- ✅ **Deploy automático via Git** (branches e tags)
- ✅ **Rollback instantâneo** para versões anteriores
- ✅ **Logs em tempo real** do container
- ✅ **Terminal interativo** para executar comandos no container
- ✅ **Histórico completo** de deployments
- ✅ **Gerenciamento de variáveis** de ambiente
- ✅ **Suporte para Frontend, Backend e Fullstack**
- ✅ **Interface web moderna** e intuitiva
- ✅ **GitHub OAuth** - Conecte e selecione repositórios facilmente
- ✅ **Detecção automática** de credenciais Git

## 🏗️ Arquitetura

```
deploy-manager/
├── backend/          # API Node.js + Express + MongoDB
├── frontend/         # Interface Next.js + React
├── docs/             # Documentação completa
└── scripts/          # Scripts auxiliares
```

**Tecnologias:**
- 🐳 **Docker** - Containerização de projetos
- 🔄 **Git** - Controle de versão e deploy
- 📦 **MongoDB** - Banco de dados
- ⚡ **Socket.IO** - Logs em tempo real
- 🎨 **Next.js + Tailwind** - Interface moderna

## �  Repositórios Privados

O sistema suporta **3 métodos de autenticação** para repositórios privados:

### 1. SSH Key (Recomendado)
- Mais seguro e não expira
- Configure a chave SSH no servidor
- Use URL no formato: `git@github.com:usuario/repo.git`

### 2. Personal Access Token
- Fácil de configurar
- Gere o token no GitHub/GitLab
- Use URL no formato: `https://github.com/usuario/repo.git`

### 3. Username + Password
- Menos seguro (não recomendado)
- Não funciona com 2FA

📖 **[Guia completo de configuração](./docs/PRIVATE-REPOS.md)**

---

## 🎉 Novidades: Logs em Tempo Real + Domínios Automáticos

### 📡 Logs de Deploy em Tempo Real

Agora você vê **exatamente o que está acontecendo** durante o deploy!

```
10:30:15 📡 Buscando atualizações do repositório...
10:30:16 🔄 Atualizando branch: main
10:30:17 📝 Configurando variáveis de ambiente...
10:30:18 🔨 Construindo imagem Docker...
10:30:45 🚀 Iniciando container...
10:30:46 ✅ Deploy concluído com sucesso!
```

**Como usar:**
1. Clique em "Deploy" no card do projeto
2. Modal abre automaticamente com logs em tempo real
3. Veja cada etapa acontecendo via WebSocket
4. Indicador mostra status da conexão (🟢/🔴)

📖 **[Guia completo de logs em tempo real](./REALTIME-DEPLOY-LOGS.md)**

### 🌐 Domínios Automáticos

Não precisa mais configurar domínio manualmente!

**Como funciona:**
- Você cria um projeto chamado `meu-app`
- Sistema gera automaticamente: `meu-app.localhost`
- Aparece no card com ícone 🌐 e badge "Teste"
- Clique para abrir em nova aba

**Domínio customizado:**
- Quer usar seu próprio domínio? Preencha o campo "Domínio"
- Exemplo: `app.meusite.com`
- Configure DNS para apontar para seu servidor

📖 **[Guia completo de domínios automáticos](./docs/AUTO-DOMAINS.md)**

---

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB
- Git
- npm ou pnpm

## 🚀 Instalação Rápida (Um Comando)

### 🐧 Linux / 🍎 Mac:

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/scripts/one-line-install.sh | bash
```

### 🪟 Windows (PowerShell como Administrador):

```powershell
iwr -useb https://raw.githubusercontent.com/seu-usuario/deploy-manager/main/install.ps1 | iex
```

### 📦 Ou com NPM (após clonar):

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
npm run install:all
npm run dev
```

📖 **[Guia de Início Rápido Completo](./QUICK-START.md)**

---

## 🐳 Instalação com Docker (Recomendado)

```bash
git clone https://github.com/seu-usuario/deploy-manager.git
cd deploy-manager
docker-compose up -d
```

Acesse: http://localhost:3000

---

## 📦 Instalação Manual

### 1. Backend

```bash
cd deploy-manager/backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npm run dev
```

### 2. Frontend

```bash
cd deploy-manager/frontend
npm install
npm run dev
```

### 3. Acesse o painel

Abra http://localhost:3000 no navegador

## 📖 Como Usar

### Criar Novo Projeto

1. Clique em "Novo Projeto"
2. Preencha as informações:
   - Nome do projeto (ex: gestao-nautica-frontend)
   - URL do repositório Git
   - Branch padrão
   - Tipo (Frontend/Backend/Fullstack)
   - Comandos de build e start
   - Variáveis de ambiente

3. Clique em "Criar Projeto"

### Fazer Deploy

1. Na lista de projetos, clique em "Deploy"
2. O sistema irá:
   - Fazer pull do repositório
   - Instalar dependências
   - Executar build (se configurado)
   - Iniciar a aplicação

### Deploy de Versão Específica

1. Clique no ícone de histórico (⏱️)
2. Escolha uma tag ou branch
3. Clique em "Deploy"

### Rollback

1. Acesse o histórico de deployments
2. Selecione a versão desejada
3. Clique em "Rollback"

## 🔧 Configuração de Projetos

### Exemplo: Next.js Frontend

```json
{
  "name": "gestao-nautica-frontend",
  "displayName": "Gestão Náutica Frontend",
  "gitUrl": "https://github.com/AlbertoSB-Dev/Gestao-Nautica-Frontend.git",
  "branch": "main",
  "type": "frontend",
  "port": 3000,
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "envVars": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  }
}
```

### Exemplo: Express Backend

```json
{
  "name": "gestao-nautica-backend",
  "displayName": "Gestão Náutica Backend",
  "gitUrl": "https://github.com/AlbertoSB-Dev/Gestao-Nautica-Backend.git",
  "branch": "main",
  "type": "backend",
  "port": 3001,
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "envVars": {
    "NODE_ENV": "production",
    "MONGODB_URI": "mongodb://localhost:27017/gestao-nautica",
    "JWT_SECRET": "your-secret-key"
  }
}
```

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/deploy-manager
JWT_SECRET=your-secret-key-here
PROJECTS_DIR=/var/www/projects
NODE_ENV=development
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📊 API Endpoints

### Projetos

- `GET /api/projects` - Listar todos os projetos
- `GET /api/projects/:id` - Obter projeto específico
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto (remove container, imagem e arquivos)

### Deploy

- `POST /api/projects/:id/deploy` - Fazer deploy
- `POST /api/projects/:id/rollback` - Fazer rollback
- `GET /api/projects/:id/versions` - Listar versões disponíveis
- `GET /api/projects/:id/logs` - Obter logs do container
- `POST /api/projects/:id/exec` - Executar comando no container

### GitHub OAuth

- `GET /api/github/auth` - Iniciar autenticação OAuth
- `GET /api/github/callback` - Callback OAuth
- `GET /api/github/repos` - Listar repositórios do usuário
- `GET /api/github/repos/:owner/:repo/branches` - Listar branches

## 📚 Documentação Completa

### 🚀 Começando
- 📖 [Guia de Início Rápido](./QUICK-START.md)
- 🎯 [Comece Aqui](./START-HERE.md)
- 💡 [Guia Rápido de Uso](./QUICK-GUIDE.md)
- 📋 [Exemplos de Uso](./EXAMPLES.md)

### 🆕 Novas Funcionalidades
- 📡 [Logs em Tempo Real](./REALTIME-DEPLOY-LOGS.md)
- 🌐 [Domínios Automáticos](./docs/AUTO-DOMAINS.md)
- 📊 [Resumo de Funcionalidades](./FEATURES-SUMMARY.md)
- ✅ [Status da Implementação](./IMPLEMENTATION-STATUS.md)

### 🔧 Configuração
- 🔐 [Repositórios Privados](./docs/PRIVATE-REPOS.md)
- 🔑 [GitHub OAuth Setup](./docs/GITHUB-OAUTH-SETUP.md)
- 🤖 [Detecção Automática de Credenciais](./docs/AUTO-CREDENTIALS.md)

### 🐳 Docker
- 🐳 [Integração Docker](./docs/DOCKER-INTEGRATION.md)
- 🐛 [Docker Troubleshooting](./docs/DOCKER-TROUBLESHOOTING.md)
- 🔧 [Docker Naming Fix](./DOCKER-NAMING-FIX.md)
- 📦 [Docker Features](./DOCKER-FEATURES.md)

### 📝 Outros
- 📝 [Changelog](./CHANGELOG.md)
- 📋 [Métodos de Instalação](./INSTALL-METHODS.md)

## 🎯 Próximos Passos

- [x] ✅ Integração com Docker
- [x] ✅ Logs em tempo real via WebSocket
- [x] ✅ Domínios automáticos
- [x] ✅ Terminal interativo
- [x] ✅ GitHub OAuth
- [x] ✅ Detecção automática de credenciais
- [ ] SSL/HTTPS automático com Let's Encrypt
- [ ] Webhooks do GitHub para deploy automático
- [ ] Monitoramento de recursos (CPU, RAM)
- [ ] Notificações (email, Slack)
- [ ] Backup automático
- [ ] Autenticação de usuários e multi-tenancy

## 📝 Licença

MIT
