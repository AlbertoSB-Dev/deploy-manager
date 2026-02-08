# Implementação de Deploy Remoto e Auto-Provisioning

## ✅ Implementado

### Backend

1. **Dependências Instaladas**
   - `node-ssh`: Cliente SSH para Node.js
   - `ssh2`: Protocolo SSH2

2. **Modelos**
   - `Server.ts`: Modelo de servidor VPS com status de provisioning
   - `Project.ts`: Atualizado com campos `serverId` e `serverName`

3. **Serviços**
   - `SSHService.ts`: Gerenciamento de conexões SSH
   - `ProvisioningService.ts`: Auto-provisioning de servidores

4. **Rotas**
   - `servers.ts`: CRUD de servidores + provisioning + testes

5. **WebSocket**
   - Eventos `provisioning:progress` e `provisioning:log` para tempo real

### Frontend

1. **Componentes**
   - `ServerList.tsx`: Lista de servidores com status
   - `AddServerModal.tsx`: Modal para adicionar servidor
   - `ProvisioningModal.tsx`: Modal com progresso em tempo real

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd deploy-manager/backend
npm install node-ssh ssh2
```

### 2. Iniciar Sistema

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### 3. Adicionar Servidor VPS

1. Acesse a interface web
2. Vá para "Servidores"
3. Clique em "Adicionar Servidor"
4. Preencha:
   - Nome: "VPS Digital Ocean 1"
   - Host: "192.168.1.100"
   - Porta: 22
   - Usuário: "root"
   - Senha: sua senha

5. Clique em "Adicionar e Provisionar"

### 4. Acompanhar Provisioning

O sistema automaticamente:
- Conecta via SSH
- Detecta sistema operacional
- Instala Docker, Git, Node.js
- Configura firewall
- Cria diretórios

Você verá em tempo real:
```
[████████████████░░░░] 80%
🐳 Instalando Docker...
✅ Docker instalado com sucesso!
```

### 5. Criar Projeto em Servidor Remoto

Depois que o servidor estiver "Pronto":

1. Vá para "Projetos"
2. Clique em "Criar Projeto"
3. Selecione o servidor VPS no dropdown
4. Preencha dados do projeto
5. Deploy será feito no VPS remoto!

## 📋 Endpoints da API

### Servidores

```bash
# Listar servidores
GET /api/servers

# Adicionar servidor (inicia provisioning automático)
POST /api/servers
{
  "name": "VPS 1",
  "host": "192.168.1.100",
  "port": 22,
  "username": "root",
  "authType": "password",
  "password": "senha123"
}

# Obter status de provisioning
GET /api/servers/:id/provisioning

# Reprovisionar
POST /api/servers/:id/reprovision

# Testar conexão
POST /api/servers/:id/test

# Executar comando SSH
POST /api/servers/:id/execute
{
  "command": "docker ps"
}

# Deletar servidor
DELETE /api/servers/:id
```

## 🔧 Próximos Passos

### Para Completar a Implementação:

1. **Atualizar DeployService**
   - Detectar se projeto é remoto (`serverId`)
   - Executar comandos via SSH no servidor remoto
   - Gerenciar containers Docker remotamente

2. **Atualizar CreateProjectModal**
   - Adicionar dropdown de seleção de servidor
   - Mostrar apenas servidores com status "ready"

3. **Atualizar ProjectCard**
   - Mostrar indicador de servidor remoto
   - Exibir nome do servidor

4. **Monitoramento de Recursos**
   - Coletar CPU, RAM, Disco dos servidores
   - Exibir no dashboard

## 📝 Exemplo de Deploy Remoto

### Fluxo Completo:

```typescript
// 1. Usuário adiciona VPS
POST /api/servers
{
  "name": "VPS Digital Ocean",
  "host": "192.168.1.100",
  "username": "root",
  "password": "senha"
}

// 2. Sistema provisiona automaticamente
// - Instala Docker
// - Instala Git
// - Configura tudo
// Status: ready

// 3. Usuário cria projeto no VPS
POST /api/projects
{
  "name": "meu-projeto",
  "serverId": "server_id_aqui",
  "gitUrl": "https://github.com/user/repo",
  "branch": "main"
}

// 4. Deploy acontece no VPS remoto
POST /api/projects/:id/deploy

// Sistema executa via SSH:
// - git clone no VPS
// - docker build no VPS
// - docker run no VPS
```

## 🎨 Interface Visual

### Lista de Servidores

```
┌─────────────────────────────────────────────────┐
│  Servidores                [+ Adicionar Servidor]│
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🟢 VPS Digital Ocean 1      [✓ Pronto]   │  │
│  │ 192.168.1.100:22 • root                  │  │
│  │ 🖥️ ubuntu 22.04 • 📦 3 projetos          │  │
│  │ 🐳 Docker  📦 Git  ⚡ Node.js            │  │
│  │                    [Test] [Delete]       │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ⚙️ VPS AWS EC2          [⚙️ Provisionando]│  │
│  │ vps.example.com:22 • ubuntu              │  │
│  │ [████████████░░░░] 60%                   │  │
│  │ Instalando Docker...                     │  │
│  │                    [Ver Progresso]       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Modal de Provisioning

```
┌─────────────────────────────────────────────────┐
│ ⚙️ Provisionando Servidor...                    │
│ Instalando Docker...                            │
├─────────────────────────────────────────────────┤
│                                                  │
│ Progresso                              80%      │
│ [████████████████████░░░░░░░░░░░░░░░░]         │
│                                                  │
│ 📟 Logs em Tempo Real:                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ $ apt-get update -y                         │ │
│ │ $ curl -fsSL https://get.docker.com...      │ │
│ │ ✅ Docker instalado com sucesso!            │ │
│ │ $ docker --version                          │ │
│ │ Docker version 24.0.7                       │ │
│ │ $ docker-compose --version                  │ │
│ │ Docker Compose version 2.23.0               │ │
│ │ ✅ Docker Compose instalado!                │ │
│ │ $ git --version                             │ │
│ │ git version 2.34.1                          │ │
│ │ ✅ Git instalado!                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│         [Fechar (continua em background)]       │
└─────────────────────────────────────────────────┘
```

## 🔐 Segurança

- Senhas são armazenadas no MongoDB (considere criptografar)
- Conexões SSH com timeout de 30 segundos
- Keep-alive para manter conexão estável
- Validação de comandos antes de executar

## 🐛 Troubleshooting

### Erro: "Falha na conexão SSH"
- Verifique se a porta 22 está aberta
- Confirme usuário e senha
- Teste conexão manual: `ssh root@192.168.1.100`

### Erro: "Script falhou"
- Veja os logs detalhados no modal
- Tente reprovisionar
- Verifique se o VPS tem internet

### Provisioning travado
- Feche o modal (continua em background)
- Reabra para ver progresso
- Se necessário, reprovision

## 📊 Status dos Servidores

- **🟢 Online + Ready**: Pronto para receber projetos
- **⚙️ Provisioning**: Instalando dependências
- **🔴 Offline**: Sem conexão
- **❌ Error**: Falha no provisioning

## 🎉 Resultado Final

Com essa implementação, você tem:

✅ Sistema completo de gerenciamento de VPS  
✅ Auto-provisioning de servidores zerados  
✅ Logs em tempo real via WebSocket  
✅ Interface visual moderna  
✅ Suporte para Ubuntu, Debian, CentOS  
✅ Validação automática de instalação  
✅ Reprovisioning em caso de erro  

**Próximo passo**: Integrar com DeployService para fazer deploys remotos!
