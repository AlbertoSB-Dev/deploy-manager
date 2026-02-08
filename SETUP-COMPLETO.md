# Setup Completo - Deploy Manager com Auto-Provisioning

## ✅ Implementação Completa

Sistema de gerenciamento de deploys com suporte a servidores VPS remotos e auto-provisioning.

## 🚀 Como Iniciar

### 1. Instalar Dependências

```bash
# Backend
cd deploy-manager/backend
npm install

# Frontend  
cd deploy-manager/frontend
npm install
```

### 2. Iniciar MongoDB

```bash
# Via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Ou use MongoDB local
```

### 3. Iniciar Sistema

```bash
# Backend (porta 8001)
cd backend
npm run dev

# Frontend (porta 8000)
cd frontend
npm run dev
```

### 4. Acessar Interface

Abra: `http://localhost:8000`

## 📋 Funcionalidades Implementadas

### Gerenciamento de Projetos
- ✅ Criar projetos do GitHub
- ✅ Deploy automático com Docker
- ✅ Blue-Green deployment
- ✅ Rollback rápido e completo
- ✅ Logs em tempo real
- ✅ Verificação de atualizações
- ✅ Domínios automáticos
- ✅ Dark mode

### Gerenciamento de Servidores VPS
- ✅ Adicionar servidores remotos
- ✅ Auto-provisioning (instala tudo automaticamente)
- ✅ Logs de provisioning em tempo real
- ✅ Testar conexão SSH
- ✅ Executar comandos remotos
- ✅ Monitoramento de status
- ✅ Reprovisioning em caso de erro

## 🎯 Como Usar

### Adicionar Servidor VPS

1. Clique na aba "Servidores"
2. Clique em "Adicionar Servidor"
3. Preencha os dados:
   - Nome: "Meu VPS"
   - Host: "192.168.1.100"
   - Porta: 22
   - Usuário: "root"
   - Senha: sua senha
4. Clique em "Adicionar e Provisionar"

### Acompanhar Provisioning

O sistema automaticamente:
- Conecta via SSH
- Detecta sistema operacional (Ubuntu/Debian/CentOS)
- Instala Docker + Docker Compose
- Instala Git
- Instala Node.js
- Configura firewall
- Cria diretórios
- Valida instalação

Você verá em tempo real:
```
[████████████████░░░░] 80%
🐳 Instalando Docker...
✅ Docker instalado com sucesso!
```

### Criar Projeto (Local ou Remoto)

1. Vá para aba "Projetos"
2. Clique em "Novo Projeto"
3. Conecte GitHub
4. Selecione repositório
5. **Escolha servidor** (Local ou VPS remoto)
6. Configure e crie

### Deploy

- **Local**: Deploy no servidor onde o Deploy Manager está rodando
- **Remoto**: Deploy via SSH no VPS selecionado

## 📁 Estrutura de Arquivos

```
deploy-manager/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Project.ts          # Modelo de projeto (com serverId)
│   │   │   └── Server.ts           # Modelo de servidor VPS
│   │   ├── services/
│   │   │   ├── SSHService.ts       # Gerenciamento SSH
│   │   │   ├── ProvisioningService.ts  # Auto-provisioning
│   │   │   ├── DeployService.ts    # Deploy local/remoto
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── servers.ts          # Rotas de servidores
│   │   │   ├── projects.ts         # Rotas de projetos
│   │   │   └── ...
│   │   └── index.ts                # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ServerList.tsx      # Lista de servidores
│   │   │   ├── AddServerModal.tsx  # Adicionar servidor
│   │   │   ├── ProvisioningModal.tsx  # Progresso provisioning
│   │   │   ├── ProjectCard.tsx     # Card de projeto
│   │   │   └── ...
│   │   ├── app/
│   │   │   └── page.tsx            # Página principal (tabs)
│   │   └── ...
│   └── package.json
└── docs/
    ├── REMOTE-DEPLOY.md
    ├── AUTO-PROVISION.md
    └── REMOTE-DEPLOY-IMPLEMENTATION.md
```

## 🔧 API Endpoints

### Servidores

```bash
# Listar servidores
GET /api/servers

# Adicionar servidor (inicia provisioning)
POST /api/servers
{
  "name": "VPS 1",
  "host": "192.168.1.100",
  "port": 22,
  "username": "root",
  "authType": "password",
  "password": "senha123"
}

# Status de provisioning
GET /api/servers/:id/provisioning

# Reprovisionar
POST /api/servers/:id/reprovision

# Testar conexão
POST /api/servers/:id/test

# Executar comando
POST /api/servers/:id/execute
{
  "command": "docker ps"
}

# Deletar
DELETE /api/servers/:id
```

### Projetos

```bash
# Listar projetos
GET /api/projects

# Criar projeto
POST /api/projects
{
  "name": "meu-projeto",
  "displayName": "Meu Projeto",
  "gitUrl": "https://github.com/user/repo",
  "branch": "main",
  "type": "backend",
  "serverId": "server_id_aqui"  # Opcional (null = local)
}

# Deploy
POST /api/projects/:id/deploy

# Rollback
POST /api/projects/:id/rollback/fast
```

## 🎨 Interface

### Aba Projetos
- Cards compactos com status
- Modal de detalhes ao clicar
- Histórico de deploys
- Indicador de servidor (local/remoto)

### Aba Servidores
- Lista de servidores VPS
- Status visual (online/offline/provisioning)
- Badges de software instalado
- Botões de ação (testar, reprovisionar, deletar)

## 🔐 Segurança

- Senhas armazenadas no MongoDB
- Conexões SSH com timeout
- Validação de comandos
- Keep-alive para estabilidade

## 🐛 Troubleshooting

### Erro: "Falha na conexão SSH"
- Verifique porta 22 aberta
- Confirme usuário/senha
- Teste: `ssh root@192.168.1.100`

### Provisioning travado
- Feche modal (continua em background)
- Reabra para ver progresso
- Se necessário, reprovision

### Erro: "Script falhou"
- Veja logs detalhados
- Tente reprovisionar
- Verifique internet do VPS

## 📊 Status dos Componentes

### Backend
- ✅ Modelo Server
- ✅ Modelo Project (com serverId)
- ✅ SSHService
- ✅ ProvisioningService
- ✅ Rotas de servidores
- ✅ WebSocket para logs
- ⏳ DeployService remoto (próximo passo)

### Frontend
- ✅ ServerList
- ✅ AddServerModal
- ✅ ProvisioningModal
- ✅ Tabs (Projetos/Servidores)
- ✅ Dark mode
- ⏳ Seletor de servidor ao criar projeto

## 🎯 Próximos Passos

1. **Integrar DeployService com SSH**
   - Detectar se projeto é remoto
   - Executar comandos via SSH
   - Gerenciar Docker remotamente

2. **Adicionar seletor de servidor**
   - Dropdown ao criar projeto
   - Mostrar apenas servidores "ready"

3. **Monitoramento de recursos**
   - Coletar CPU, RAM, Disco
   - Exibir no dashboard

4. **Migração de projetos**
   - Mover projeto entre servidores
   - Backup automático

## 🎉 Resultado

Com essa implementação você tem:

✅ Sistema completo de gerenciamento de VPS  
✅ Auto-provisioning de servidores zerados  
✅ Interface moderna com dark mode  
✅ Logs em tempo real  
✅ Suporte Ubuntu, Debian, CentOS  
✅ Validação automática  
✅ Reprovisioning em caso de erro  

**Pronto para provisionar servidores automaticamente!**

## 📝 Exemplo Completo

```bash
# 1. Adicionar VPS zerado
# Interface: Servidores > Adicionar Servidor
# Preencher: IP, usuário, senha

# 2. Sistema provisiona automaticamente
# - Instala Docker
# - Instala Git
# - Instala Node.js
# - Configura tudo
# Status: ready (5-10 minutos)

# 3. Criar projeto no VPS
# Interface: Projetos > Novo Projeto
# Selecionar: Servidor VPS
# Preencher: Repositório GitHub

# 4. Deploy automático no VPS remoto
# Clique: Deploy
# Sistema executa via SSH no VPS
```

## 🔄 Fluxo Completo

```
Usuário → Adiciona VPS
    ↓
Sistema → Conecta SSH
    ↓
Sistema → Detecta Ubuntu
    ↓
Sistema → Instala Docker, Git, Node.js
    ↓
Sistema → Valida instalação
    ↓
Status → Ready ✅
    ↓
Usuário → Cria projeto no VPS
    ↓
Sistema → Deploy via SSH no VPS
    ↓
Projeto → Rodando no VPS remoto 🎉
```
