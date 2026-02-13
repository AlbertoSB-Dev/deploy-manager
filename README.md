# 🚀 Ark Deploy

Painel centralizado para gerenciar servidores VPS via SSH. Configure, faça deploy e monitore múltiplos servidores sem instalar nada neles. Tudo automatizado.

> **🎉 Última Atualização (13/02/2026):** Sistema de verificação automática de atualizações via GitHub API implementado! Agora o painel detecta automaticamente quando há novas versões disponíveis.

## ⚡ Instalação em 1 Comando

```bash
curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-one-command.sh | bash
```

**Pronto!** Em 2 minutos você terá:
- ✅ Docker e Docker Compose instalados
- ✅ MongoDB configurado
- ✅ Backend e Frontend rodando
- ✅ Usuário admin criado (admin@admin.com / admin123)
- ✅ Domínios automáticos com sslip.io

**Acesse:** `http://painel.SEU_IP.sslip.io`

## 🚀 Modo Produção

O sistema é instalado automaticamente em modo produção. Para verificar:

```bash
cd /opt/ark-deploy
docker-compose logs frontend | grep -i "ready"
```

Se aparecer "npm run dev", force o modo produção:

```bash
cd /opt/ark-deploy
./switch-to-production.sh
```

📖 **Documentação completa:** [PRODUCTION.md](PRODUCTION.md)

---

## ✨ Funcionalidades

- ✅ **Gerenciamento Centralizado** - Controle múltiplos servidores VPS de um único painel
- ✅ **Configuração Automática** - Conecte via SSH e o sistema configura tudo: Docker, Nginx, SSL
- ✅ **Sem Instalações** - Não precisa instalar painéis nos servidores, apenas acesso SSH
- ✅ **Deploy Remoto** - Faça deploy em qualquer servidor conectado via Git
- ✅ **Multi-Projeto** - Gerencie múltiplos projetos em múltiplos servidores
- ✅ **Rollback instantâneo** - Volte para versões anteriores com um clique
- ✅ **Logs em tempo real** - Acompanhe deploys e containers via WebSocket
- ✅ **Terminal SSH integrado** - Execute comandos remotos direto do painel
- ✅ **Histórico completo** - Todos os deploys registrados
- ✅ **Variáveis de ambiente** - Gerencie configurações de cada projeto
- ✅ **Interface moderna** - Dark mode e design responsivo
- ✅ **GitHub OAuth** - Conecte repositórios facilmente
- ✅ **Repositórios privados** - SSH Key, Token ou Basic Auth
- ✅ **Proxy reverso** - Traefik e Nginx configurados automaticamente
- ✅ **Domínios automáticos** - Sistema gera domínios de teste com sslip.io
- ✅ **Sistema de Atualização** - Atualize o painel diretamente do GitHub
- ✅ **Gerenciamento de Versões** - Controle de versão integrado
- 🆕 **Detecção Automática de Updates** - Notificação quando há novas versões disponíveis

## 🔄 Sistema de Atualizações

O Ark Deploy agora detecta automaticamente quando há atualizações disponíveis no GitHub:

- 🔍 **Verificação Automática** - A cada 5 minutos via GitHub API
- 🎯 **Banner de Notificação** - Alerta visual quando há updates
- 📊 **Detalhes Completos** - Veja commits, mensagens e datas
- 🚀 **Deploy Facilitado** - Crie versão e faça deploy com poucos cliques
- 🔙 **Rollback Seguro** - Volte para versões anteriores se necessário

**Como usar:**
1. Acesse: Admin > Deploy do Painel
2. Clique em "Verificar Atualizações"
3. Se houver updates, clique em "Nova Versão"
4. Aguarde o build e faça deploy

📖 **Documentação:** [ATUALIZACAO-SISTEMA.md](ATUALIZACAO-SISTEMA.md)

## 🏗️ Arquitetura

```
ark-deploy/
├── backend/          # API Node.js + Express + MongoDB
├── frontend/         # Interface Next.js + React
├── docs/             # Documentação
└── scripts/          # Scripts auxiliares
```

**Stack:**
- 🐳 Docker - Containerização
- 🔄 Git - Controle de versão
- 📦 MongoDB - Banco de dados
- ⚡ Socket.IO - Logs em tempo real
- 🎨 Next.js + Tailwind - Interface

## 🎯 Como Funciona

1. **Adicione um Servidor VPS**
   - Informe IP, usuário e senha/chave SSH
   - O sistema conecta e configura tudo automaticamente

2. **Crie um Projeto**
   - Escolha o servidor de destino
   - Configure repositório Git e variáveis
   - Faça deploy com um clique

3. **Gerencie Tudo Centralizado**
   - Monitore todos os servidores
   - Veja logs em tempo real
   - Execute comandos remotos
   - Faça rollback quando necessário

## 🔑 Diferenciais

- **Sem instalações nos servidores** - Apenas SSH é necessário
- **Configuração zero** - Docker, Nginx, SSL tudo automático
- **Multi-servidor** - Gerencie quantos quiser
- **Painel único** - Controle tudo de um lugar

## 📋 Pré-requisitos

**Para o Painel (Ark Deploy):**
- Node.js 18+
- MongoDB
- Git

**Para os Servidores VPS (gerenciados):**
- Apenas acesso SSH (root ou sudo)
- Ubuntu/Debian (recomendado)
- O sistema instala Docker e dependências automaticamente

## 🚀 Instalação Rápida (1 Comando)

```bash
curl -fsSL https://raw.githubusercontent.com/AlbertoSB-Dev/deploy-manager/main/install-simple.sh | sudo bash
```

**OU com Docker (Recomendado):**

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
docker-compose up -d
```

**OU build único (Backend + Frontend em 1 container):**

```bash
git clone https://github.com/AlbertoSB-Dev/deploy-manager.git
cd deploy-manager
docker build -t ark-deploy:latest .
docker run -d --name ark-deploy -p 8000:8000 -p 8001:8001 \
  -e MONGODB_URI="mongodb://admin:senha@mongodb:27017/ark-deploy?authSource=admin" \
  -e JWT_SECRET="seu-secret" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ark-deploy:latest
```

**Pronto!** Acesse: `http://SEU_IP:8000`

**Login:** admin@admin.com / admin123

📚 **Guia completo de deploy com Docker:** [DOCKER-DEPLOY.md](./DOCKER-DEPLOY.md)

---

## 📋 Instalação Detalhada Rápida (1 Comando!)

```bash
# Clone e instale TUDO automaticamente
git clone https://github.com/AlbertoSB-Dev/ark-deploy.git
cd ark-deploy
chmod +x install.sh
sudo ./install.sh
```

**Pronto!** O script faz tudo:
- ✅ Instala Docker e Docker Compose
- ✅ Cria rede do Traefik
- ✅ Configura firewall
- ✅ Gera secrets de segurança
- ✅ Cria arquivo .env
- ✅ Inicia containers Docker
- ✅ Cria usuário admin automaticamente

Após 2-3 minutos, acesse: 
- **http://SEU_IP:8000** (acesso direto)
- **http://ark-deploy.SEU_IP.sslip.io** (via Traefik)

**Credenciais padrão:**
- Email: `admin@admin.com`
- Senha: `admin123`

⚠️ **Importante:** Altere a senha após o primeiro login!

## 🔄 Sistema de Atualização

O Ark Deploy possui um sistema de atualização integrado que permite atualizar o painel diretamente do GitHub:

### Notificações de Atualização

- **Verificação automática** - O sistema verifica se há atualizações ao carregar a página de configurações
- **Banner de alerta** - Quando há atualizações, um banner amarelo destaca as mudanças disponíveis
- **Detalhes da atualização** - Mostra quantos commits estão disponíveis e a mensagem do último commit

### Atualização do Sistema

1. Acesse **Admin > Configurações**
2. Se houver atualizações, clique em **"Atualizar Agora"** no banner
3. Ou clique em **"Atualizar Sistema"** na seção de versão
4. O sistema irá:
   - Fazer backup do .env
   - Baixar atualizações do GitHub
   - Instalar dependências
   - Reconstruir containers
   - Reiniciar automaticamente

### Controle de Versões

- **Histórico completo** - Veja todas as versões disponíveis (Git tags)
- **Rollback com um clique** - Volte para qualquer versão anterior
- **Informações detalhadas** - Cada versão mostra tag, commit, data e descrição

**Como fazer rollback:**
1. Acesse **Admin > Configurações**
2. Clique no ícone de histórico na seção "Versão do Sistema"
3. Encontre a versão desejada
4. Clique no botão de rollback
5. Confirme e aguarde a reinicialização

**Informações exibidas:**
- Versão atual
- Branch Git
- Commit atual
- Última atualização
- Uptime do sistema
- Notificação de novas versões

📚 **Documentação completa:** [VERSION-CONTROL.md](./VERSION-CONTROL.md)

## 🌐 Domínios Automáticos

O painel utiliza **sslip.io** para gerar domínios automáticos:

- **Painel:** `ark-deploy.SEU_IP.sslip.io`
- **Projetos:** `nome-projeto.SEU_IP.sslip.io`

Você pode configurar seu próprio domínio em **Admin > Configurações**.

---

## 📋 Detalhes das Opções de Instalação

### Opção 1: Instalação com Docker (Recomendado)

**Mais fácil e rápido!** Tudo roda em containers isolados.

```bash
# Clone o repositório
git clone https://github.com/AlbertoSB-Dev/ark-deploy.git
cd ark-deploy

# Execute o instalador Docker
chmod +x install-docker.sh
sudo ./install-docker.sh

# Inicie os containers
docker-compose up -d

# Aguarde 30-60 segundos e crie o admin
docker-compose exec backend node scripts/make-admin-auto.js
```

Acesse: http://SEU_IP:8000

**Comandos úteis:**
```bash
docker-compose logs -f          # Ver logs em tempo real
docker-compose ps               # Ver status dos containers
docker-compose restart          # Reiniciar todos os serviços
docker-compose down             # Parar tudo
docker-compose exec backend sh  # Acessar terminal do backend
```

### Opção 2: Instalação Nativa (Avançado)

Instala diretamente no servidor sem Docker.

```bash
# Clone o repositório
git clone https://github.com/AlbertoSB-Dev/ark-deploy.git
cd ark-deploy

# Execute o instalador
chmod +x install.sh
sudo ./install.sh
```

O instalador irá:
- ✅ Atualizar o sistema
- ✅ Instalar Docker e Docker Compose
- ✅ Instalar Node.js 20
- ✅ Instalar MongoDB
- ✅ Instalar e configurar Traefik
- ✅ Configurar firewall
- ✅ Criar diretórios necessários
- ✅ Gerar secrets de segurança
- ✅ Instalar dependências do projeto

Após a instalação:
```bash
# Inicie o backend
cd backend && npm run dev

# Inicie o frontend (em outro terminal)
cd frontend && npm run dev

# Crie o primeiro usuário admin
cd backend && node scripts/make-admin-auto.js
```

Acesse: http://SEU_IP:8000

### Manual

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 📖 Como Usar

### 1. Adicionar Servidor VPS

1. Acesse a aba "Servidores"
2. Clique em "Adicionar Servidor"
3. Preencha:
   - Nome do servidor
   - IP/Host
   - Usuário SSH (root ou com sudo)
   - Senha ou chave SSH
4. Clique em "Conectar"
5. O sistema configura automaticamente: Docker, Nginx, Traefik, etc.

### 2. Criar Projeto

1. Clique em "Novo Projeto"
2. Preencha:
   - Nome do projeto
   - URL do repositório Git
   - Branch padrão
   - Tipo (Frontend/Backend/Fullstack)
   - Comandos de build e start
   - Variáveis de ambiente
3. Clique em "Criar Projeto"

### 2. Fazer Deploy

1. Clique em "Deploy" no card do projeto
2. Acompanhe os logs em tempo real
3. Acesse o projeto pelo domínio gerado

### 3. Rollback

1. Clique em "Rollback" para voltar à versão anterior (rápido)
2. Ou acesse o histórico para escolher uma versão específica

## 🔧 Configuração de Variáveis de Ambiente

### 📁 Estrutura de Arquivos .env

O projeto usa uma estrutura centralizada para facilitar a configuração:

```
deploy-manager/
├── .env                    # ✅ PRODUÇÃO (Docker) - USE ESTE
├── .env.example            # Template com todas as variáveis
├── .env.production         # Template específico para VPS
├── backend/
│   ├── .env               # ⚠️ Apenas desenvolvimento local
│   └── .env.example
└── frontend/
    ├── .env.local         # ⚠️ Apenas desenvolvimento local
    └── .env.example
```

### 🎯 Qual Arquivo Usar?

**Em Produção (VPS com Docker):**
```bash
cd /opt/ark-deploy
cp .env.production .env
nano .env  # Ajustar valores
```

**Em Desenvolvimento Local:**
- Backend: `backend/.env`
- Frontend: `frontend/.env.local`

### ⚙️ Variáveis Principais

```env
# MongoDB
MONGO_PASSWORD=sua-senha-segura

# Segurança (gere com: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
JWT_SECRET=sua-chave-jwt
ENCRYPTION_KEY=sua-chave-encryption

# Servidor
SERVER_IP=38.242.213.195
BASE_DOMAIN=sslip.io
FRONTEND_URL=http://painel.SEU_IP.sslip.io

# API URL (IMPORTANTE: requer rebuild do frontend se mudar)
NEXT_PUBLIC_API_URL=http://api.SEU_IP.sslip.io/api

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://painel.SEU_IP.sslip.io/auth/github/callback

# Assas (configurável pelo painel)
ASSAS_API_KEY=
ASSAS_WEBHOOK_TOKEN=
ASSAS_ENVIRONMENT=sandbox

# Email (opcional)
EMAIL_ENABLED=false
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
```

### 🔄 Aplicar Mudanças

**Variáveis Runtime (maioria):**
```bash
docker-compose restart backend
```

**NEXT_PUBLIC_API_URL (build-time):**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

📖 **Documentação completa:** [ENV-SETUP.md](./ENV-SETUP.md)

### 🔍 Verificar Configuração

Use o script de diagnóstico para verificar se tudo está correto:

```bash
chmod +x check-env.sh
./check-env.sh
```

O script verifica:
- ✅ Arquivo .env existe e está configurado
- ✅ Variáveis obrigatórias estão preenchidas
- ✅ Containers Docker estão rodando
- ✅ NEXT_PUBLIC_API_URL está correto
- ✅ Socket.IO não está tentando conectar em localhost

### 🔄 Migrar de Configuração Antiga

Se você tem `backend/.env` e `frontend/.env.local`:

```bash
chmod +x migrate-env.sh
./migrate-env.sh
```

O script migra automaticamente todas as variáveis para `.env` na raiz.

## 📊 API Endpoints

### Projetos
- `GET /api/projects` - Listar projetos
- `POST /api/projects` - Criar projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto

### Deploy
- `POST /api/projects/:id/deploy` - Fazer deploy
- `POST /api/projects/:id/rollback` - Fazer rollback
- `GET /api/projects/:id/logs` - Obter logs
- `POST /api/projects/:id/exec` - Executar comando

### GitHub
- `GET /api/github/auth` - Iniciar OAuth
- `GET /api/github/repos` - Listar repositórios

## 📚 Documentação

- 📖 [Guia de Início Rápido](./QUICK-START.md)
- 🐳 [Deploy com Docker](./DOCKER-DEPLOY.md)
- 📦 [Instalação Detalhada](./INSTALACAO.md)
- ⚡ [Instalação em 1 Linha](./INSTALL-ONE-LINE.md)
- 🔄 [Sistema de Controle de Versões](./VERSION-CONTROL.md)
- 🔐 [Repositórios Privados](./docs/PRIVATE-REPOS.md)
- 🔑 [GitHub OAuth Setup](./docs/GITHUB-OAUTH-SETUP.md)
- 🐳 [Integração Docker](./docs/DOCKER-INTEGRATION.md)
- 🐛 [Docker Troubleshooting](./docs/DOCKER-TROUBLESHOOTING.md)
- ⚙️ [Configuração de Variáveis](./ENV-SETUP.md)
- 📝 [Changelog](./CHANGELOG.md)

## 🔧 Troubleshooting

### Socket.IO não conecta (erro CORS)

**Sintoma**: Erro no console do navegador sobre localhost:8001

**Causa**: `NEXT_PUBLIC_API_URL` não configurado corretamente

**Solução**:
```bash
# 1. Verificar configuração
./check-env.sh

# 2. Corrigir .env se necessário
nano .env
# NEXT_PUBLIC_API_URL=http://api.SEU_IP.sslip.io/api

# 3. Rebuild do frontend (obrigatório!)
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Sistema não detecta atualizações

**Causa**: Commit hash não capturado durante build

**Solução**:
```bash
docker-compose build --no-cache backend
docker-compose up -d
docker-compose logs backend | grep -i "commit"
```

### Containers não iniciam

**Solução**:
```bash
# Ver logs detalhados
docker-compose logs

# Verificar configuração
./check-env.sh

# Reiniciar do zero
docker-compose down
docker-compose up -d
```

### Migrar de configuração antiga

Se você tem `backend/.env` e `frontend/.env.local`:

```bash
./migrate-env.sh
```

📖 **Mais soluções**: [ENV-SETUP.md](./ENV-SETUP.md#-erros-comuns)

## 🎯 Roadmap

- [x] Integração com Docker
- [x] Logs em tempo real via WebSocket
- [x] Domínios automáticos
- [x] Terminal interativo
- [x] GitHub OAuth
- [x] Deploy remoto via SSH
- [x] Sistema de atualização automática
- [x] Notificações de novas versões
- [x] Controle de versões com rollback
- [ ] SSL/HTTPS automático com Let's Encrypt
- [ ] Webhooks do GitHub
- [ ] Monitoramento de recursos
- [ ] Notificações (email, Slack)
- [ ] Backup automático

## 📝 Licença

MIT
