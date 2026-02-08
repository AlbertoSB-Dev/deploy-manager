# Deploy Remoto - Gerenciar VPS Externos

## 🎯 Objetivo

Permitir que o Deploy Manager gerencie projetos em servidores VPS remotos através de conexões SSH, executando comandos Docker remotamente.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│   Deploy Manager (Servidor Local)   │
│                                     │
│  ┌──────────┐      ┌─────────────┐ │
│  │ Frontend │ ───► │   Backend   │ │
│  └──────────┘      └──────┬──────┘ │
│                           │         │
└───────────────────────────┼─────────┘
                            │
                            │ SSH
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌────────┐          ┌────────┐         ┌────────┐
   │ VPS 1  │          │ VPS 2  │         │ VPS 3  │
   │ Docker │          │ Docker │         │ Docker │
   └────────┘          └────────┘         └────────┘
```

## 📋 Funcionalidades

### 1. Gerenciamento de Servidores
- Cadastrar múltiplos VPS
- Armazenar credenciais SSH de forma segura
- Testar conexão com servidores
- Monitorar status (online/offline)

### 2. Deploy em Servidor Específico
- Escolher qual VPS ao criar projeto
- Executar comandos Docker via SSH
- Transferir arquivos quando necessário
- Logs em tempo real via SSH

### 3. Monitoramento Multi-Servidor
- Dashboard com status de todos os servidores
- Recursos utilizados (CPU, RAM, Disco)
- Quantidade de projetos por servidor
- Load balancing manual

## 🔧 Implementação

### Modelo de Servidor

```typescript
// backend/src/models/Server.ts
interface Server {
  _id: string;
  name: string;              // "VPS Digital Ocean 1"
  host: string;              // "192.168.1.100" ou "vps.example.com"
  port: number;              // 22 (SSH)
  username: string;          // "root" ou "ubuntu"
  authType: 'password' | 'key';
  password?: string;         // Criptografado
  privateKey?: string;       // Caminho para chave SSH
  status: 'online' | 'offline' | 'error';
  lastCheck: Date;
  resources: {
    cpu: number;             // Porcentagem
    memory: number;          // MB
    disk: number;            // GB
  };
  projects: string[];        // IDs dos projetos
  createdAt: Date;
}
```

### Modelo de Projeto Atualizado

```typescript
// Adicionar ao Project.ts existente
interface Project {
  // ... campos existentes
  serverId?: string;         // ID do servidor (null = local)
  serverName?: string;       // Nome do servidor para exibição
}
```

### Serviço SSH

```typescript
// backend/src/services/SSHService.ts
import { NodeSSH } from 'node-ssh';

class SSHService {
  private connections: Map<string, NodeSSH> = new Map();

  async connect(server: Server): Promise<NodeSSH> {
    const ssh = new NodeSSH();
    
    if (server.authType === 'password') {
      await ssh.connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password
      });
    } else {
      await ssh.connect({
        host: server.host,
        port: server.port,
        username: server.username,
        privateKey: server.privateKey
      });
    }
    
    this.connections.set(server._id, ssh);
    return ssh;
  }

  async executeCommand(serverId: string, command: string): Promise<string> {
    const ssh = this.connections.get(serverId);
    if (!ssh) throw new Error('Servidor não conectado');
    
    const result = await ssh.execCommand(command);
    return result.stdout;
  }

  async disconnect(serverId: string): Promise<void> {
    const ssh = this.connections.get(serverId);
    if (ssh) {
      ssh.dispose();
      this.connections.delete(serverId);
    }
  }
}
```

### Deploy Service Atualizado

```typescript
// backend/src/services/DeployService.ts
class DeployService {
  async deploy(project: Project) {
    if (project.serverId) {
      // Deploy remoto via SSH
      return this.deployRemote(project);
    } else {
      // Deploy local (código atual)
      return this.deployLocal(project);
    }
  }

  private async deployRemote(project: Project) {
    const server = await Server.findById(project.serverId);
    const ssh = await sshService.connect(server);
    
    // 1. Clonar repositório no servidor remoto
    await ssh.execCommand(`
      cd /opt/projects &&
      git clone ${project.gitUrl} ${project.name} ||
      (cd ${project.name} && git pull)
    `);
    
    // 2. Build da imagem Docker no servidor remoto
    await ssh.execCommand(`
      cd /opt/projects/${project.name} &&
      docker build -t ${project.name}:${version} .
    `);
    
    // 3. Parar container antigo
    await ssh.execCommand(`docker stop ${project.name} || true`);
    
    // 4. Iniciar novo container
    await ssh.execCommand(`
      docker run -d \
        --name ${project.name} \
        -p ${project.port}:${project.port} \
        ${project.name}:${version}
    `);
    
    return { success: true };
  }
}
```

## 🎨 Interface do Usuário

### 1. Página de Servidores

```
┌─────────────────────────────────────────────────┐
│  Servidores                    [+ Novo Servidor] │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🟢 VPS Digital Ocean 1                   │  │
│  │ 192.168.1.100:22                         │  │
│  │ 3 projetos • CPU: 45% • RAM: 2.1GB      │  │
│  │ [Ver Projetos] [Editar] [Testar]        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🟢 VPS AWS EC2                           │  │
│  │ vps.example.com:22                       │  │
│  │ 1 projeto • CPU: 12% • RAM: 512MB       │  │
│  │ [Ver Projetos] [Editar] [Testar]        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 💻 Servidor Local                        │  │
│  │ localhost                                 │  │
│  │ 5 projetos • CPU: 23% • RAM: 4.2GB      │  │
│  │ [Ver Projetos]                           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 2. Criar Projeto com Seleção de Servidor

```
┌─────────────────────────────────────┐
│  Criar Novo Projeto                 │
├─────────────────────────────────────┤
│                                     │
│  Nome do Projeto:                   │
│  [___________________________]      │
│                                     │
│  Servidor de Deploy:                │
│  [▼ Selecione o servidor     ]      │
│     • Servidor Local                │
│     • VPS Digital Ocean 1           │
│     • VPS AWS EC2                   │
│                                     │
│  Repositório Git:                   │
│  [___________________________]      │
│                                     │
│  Branch:                            │
│  [main                       ▼]     │
│                                     │
│  [Cancelar]  [Criar Projeto]        │
└─────────────────────────────────────┘
```

### 3. Card de Projeto com Indicador de Servidor

```
┌────────────────────────────────────┐
│ 🚀 Gestão Náutica Backend          │
│ 🌐 VPS Digital Ocean 1             │ ← Novo indicador
│ main • v1.2.3                      │
│ projeto.192.168.1.100.sslip.io     │
│ há 2 horas                         │
└────────────────────────────────────┘
```

## 📦 Dependências Necessárias

```json
{
  "dependencies": {
    "node-ssh": "^13.1.0",      // Cliente SSH para Node.js
    "ssh2": "^1.14.0",          // Protocolo SSH2
    "crypto": "^1.0.1"          // Criptografia para senhas
  }
}
```

## 🔐 Segurança

### 1. Armazenamento de Credenciais
- Senhas criptografadas com AES-256
- Chaves SSH armazenadas com permissões restritas
- Variáveis de ambiente para chave de criptografia

### 2. Conexões SSH
- Timeout de conexão configurável
- Retry automático em caso de falha
- Keep-alive para manter conexão ativa

### 3. Validações
- Verificar se Docker está instalado no servidor remoto
- Validar permissões do usuário SSH
- Testar conectividade antes de deploy

## 🚀 Fluxo de Deploy Remoto

```
1. Usuário clica em "Deploy"
   ↓
2. Backend identifica que projeto é remoto
   ↓
3. Conecta via SSH no servidor VPS
   ↓
4. Clona/atualiza repositório Git no VPS
   ↓
5. Executa docker build no VPS
   ↓
6. Para container antigo (Blue-Green)
   ↓
7. Inicia novo container no VPS
   ↓
8. Verifica se container está rodando
   ↓
9. Atualiza status no banco de dados
   ↓
10. Retorna sucesso para frontend
```

## 📊 Monitoramento

### Comandos SSH para Coletar Métricas

```bash
# CPU
top -bn1 | grep "Cpu(s)" | awk '{print $2}'

# Memória
free -m | awk 'NR==2{printf "%.2f", $3}'

# Disco
df -h / | awk 'NR==2{print $3}'

# Containers rodando
docker ps --format "{{.Names}}" | wc -l

# Status de um container específico
docker inspect --format='{{.State.Status}}' container_name
```

## 🎯 Vantagens

1. **Centralização**: Gerenciar todos os VPS de um único painel
2. **Escalabilidade**: Adicionar novos servidores facilmente
3. **Flexibilidade**: Escolher onde cada projeto será deployado
4. **Economia**: Distribuir projetos entre servidores conforme recursos
5. **Backup**: Se um VPS cair, outros continuam funcionando

## ⚠️ Considerações

1. **Latência**: Comandos SSH podem ser mais lentos que locais
2. **Rede**: Requer conexão estável com os VPS
3. **Segurança**: Gerenciar credenciais SSH com cuidado
4. **Firewall**: Portas SSH (22) devem estar abertas
5. **Docker**: Todos os VPS precisam ter Docker instalado

## 🔄 Migração de Projeto

Permitir mover projeto de um servidor para outro:

```typescript
async migrateProject(projectId: string, newServerId: string) {
  // 1. Fazer backup do projeto atual
  // 2. Deploy no novo servidor
  // 3. Testar se está funcionando
  // 4. Atualizar DNS/domínio
  // 5. Remover do servidor antigo
}
```

## 📝 Próximos Passos para Implementação

1. ✅ Criar modelo de Server
2. ✅ Implementar SSHService
3. ✅ Atualizar DeployService para suportar remoto
4. ✅ Criar interface de gerenciamento de servidores
5. ✅ Adicionar seletor de servidor ao criar projeto
6. ✅ Implementar monitoramento de recursos
7. ✅ Adicionar logs de conexão SSH
8. ✅ Testar com VPS real

## 💡 Exemplo de Uso

```bash
# 1. Adicionar servidor VPS
POST /api/servers
{
  "name": "VPS Digital Ocean",
  "host": "192.168.1.100",
  "port": 22,
  "username": "root",
  "authType": "password",
  "password": "senha_segura"
}

# 2. Criar projeto no VPS
POST /api/projects
{
  "name": "meu-projeto",
  "serverId": "server_id_aqui",
  "gitUrl": "https://github.com/user/repo",
  "branch": "main"
}

# 3. Deploy automático no VPS remoto
POST /api/projects/:id/deploy
```

## 🎉 Resultado Final

Com essa implementação, você terá:
- Um painel único para gerenciar múltiplos VPS
- Deploy automático em qualquer servidor cadastrado
- Monitoramento centralizado de recursos
- Flexibilidade para distribuir projetos
- Escalabilidade horizontal fácil
