# 🚀 Ark Deploy

Painel centralizado para gerenciar servidores VPS via SSH. Configure, faça deploy e monitore múltiplos servidores sem instalar nada neles. Tudo automatizado.

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

## 🚀 Instalação Rápida (1 Comando!)

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

## 🔧 Configuração

### Backend (.env)

```env
PORT=8001
MONGODB_URI=mongodb://localhost:27017/ark-deploy
JWT_SECRET=your-secret-key
PROJECTS_DIR=/var/www/projects
NODE_ENV=development
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

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
- 🔄 [Sistema de Controle de Versões](./VERSION-CONTROL.md)
- 🔐 [Repositórios Privados](./docs/PRIVATE-REPOS.md)
- 🔑 [GitHub OAuth Setup](./docs/GITHUB-OAUTH-SETUP.md)
- 🐳 [Integração Docker](./docs/DOCKER-INTEGRATION.md)
- 🐛 [Docker Troubleshooting](./docs/DOCKER-TROUBLESHOOTING.md)
- 📝 [Changelog](./CHANGELOG.md)

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
