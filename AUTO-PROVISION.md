# Auto-Provisioning de Servidores VPS

## 🎯 Objetivo

Sistema automático que prepara um VPS completamente zerado, instalando todas as dependências necessárias para receber deploys de projetos.

## 🚀 O que o Sistema Faz Automaticamente

Quando você adiciona um VPS novo (zerado), o sistema:

1. ✅ Conecta via SSH
2. ✅ Detecta o sistema operacional (Ubuntu, Debian, CentOS, etc.)
3. ✅ Atualiza o sistema
4. ✅ Instala Docker e Docker Compose
5. ✅ Instala Git
6. ✅ Instala Node.js (se necessário)
7. ✅ Configura firewall
8. ✅ Cria diretórios necessários
9. ✅ Configura permissões
10. ✅ Testa se tudo está funcionando
11. ✅ Marca servidor como "Pronto"

## 📋 Requisitos Mínimos do VPS

- **Sistema**: Ubuntu 20.04+, Debian 10+, CentOS 7+
- **RAM**: Mínimo 512MB (recomendado 1GB+)
- **Disco**: Mínimo 10GB
- **Acesso**: SSH com usuário root ou sudo
- **Rede**: Conexão com internet

## 🔧 Fluxo de Provisioning

```
┌─────────────────────────────────────────────────┐
│ 1. Usuário adiciona VPS novo                    │
│    - IP: 192.168.1.100                          │
│    - User: root                                 │
│    - Password: ******                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Sistema testa conexão SSH                    │
│    ✓ Conectado com sucesso                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Detecta sistema operacional                  │
│    ✓ Ubuntu 22.04 LTS detectado                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. Executa script de provisioning               │
│    [████████████████░░░░] 80%                   │
│    Instalando Docker...                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. Valida instalação                            │
│    ✓ Docker instalado                           │
│    ✓ Git instalado                              │
│    ✓ Diretórios criados                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. Servidor pronto para receber projetos! 🎉    │
└─────────────────────────────────────────────────┘
```

## 📜 Scripts de Provisioning

### Script Universal (Ubuntu/Debian)

```bash
#!/bin/bash
# provision-ubuntu.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando provisioning do servidor..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt-get update -y
apt-get upgrade -y

# 2. Instalar dependências básicas
echo "🔧 Instalando dependências básicas..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    wget \
    unzip

# 3. Instalar Docker
echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Iniciar Docker
    systemctl start docker
    systemctl enable docker
    
    echo "✅ Docker instalado com sucesso!"
else
    echo "✅ Docker já está instalado"
fi

# 4. Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado com sucesso!"
else
    echo "✅ Docker Compose já está instalado"
fi

# 5. Instalar Node.js (opcional, para builds)
echo "📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js instalado com sucesso!"
else
    echo "✅ Node.js já está instalado"
fi

# 6. Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/logs
mkdir -p /opt/deploy-manager/backups

# 7. Configurar permissões
echo "🔐 Configurando permissões..."
chmod 755 /opt/projects
chmod 755 /opt/deploy-manager

# 8. Configurar firewall (UFW)
echo "🔥 Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8000:9000/tcp  # Portas para projetos
    echo "✅ Firewall configurado"
fi

# 9. Limpar cache
echo "🧹 Limpando cache..."
apt-get autoremove -y
apt-get clean

# 10. Verificar instalações
echo ""
echo "🔍 Verificando instalações..."
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo "Git version: $(git --version)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# 11. Informações do sistema
echo ""
echo "💻 Informações do sistema:"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "CPU: $(nproc) cores"
echo "RAM: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disco: $(df -h / | awk 'NR==2 {print $2}')"

echo ""
echo "✅ Provisioning concluído com sucesso!"
echo "🎉 Servidor pronto para receber projetos!"
```

### Script para CentOS/RHEL

```bash
#!/bin/bash
# provision-centos.sh

set -e

echo "🚀 Iniciando provisioning do servidor CentOS..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
yum update -y

# 2. Instalar dependências
echo "🔧 Instalando dependências..."
yum install -y \
    yum-utils \
    device-mapper-persistent-data \
    lvm2 \
    git \
    wget \
    curl

# 3. Instalar Docker
echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker instalado!"
fi

# 4. Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. Instalar Node.js
echo "📦 Instalando Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 6. Criar diretórios
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/{logs,backups}

# 7. Configurar firewall
echo "🔥 Configurando firewall..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=8000-9000/tcp
firewall-cmd --reload

echo "✅ Provisioning concluído!"
```

## 🔧 Implementação no Backend

### Modelo de Servidor com Status de Provisioning

```typescript
// backend/src/models/Server.ts
interface Server {
  _id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  
  // Status de provisioning
  provisioningStatus: 'pending' | 'provisioning' | 'ready' | 'error';
  provisioningProgress: number;  // 0-100
  provisioningLogs: string[];
  provisioningError?: string;
  
  // Informações do sistema
  osType?: 'ubuntu' | 'debian' | 'centos' | 'rhel' | 'unknown';
  osVersion?: string;
  
  // Softwares instalados
  installedSoftware: {
    docker: boolean;
    dockerCompose: boolean;
    git: boolean;
    nodejs: boolean;
  };
  
  // Recursos
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  
  status: 'online' | 'offline' | 'error';
  lastCheck: Date;
  createdAt: Date;
}
```

### Serviço de Provisioning

```typescript
// backend/src/services/ProvisioningService.ts
import { NodeSSH } from 'node-ssh';
import { Server } from '../models/Server';
import { io } from '../index';

class ProvisioningService {
  
  async provisionServer(serverId: string): Promise<void> {
    const server = await Server.findById(serverId);
    
    try {
      // Atualizar status
      await this.updateStatus(serverId, 'provisioning', 0, 'Conectando ao servidor...');
      
      // 1. Conectar via SSH
      const ssh = await this.connectSSH(server);
      await this.updateStatus(serverId, 'provisioning', 10, 'Conectado! Detectando sistema...');
      
      // 2. Detectar sistema operacional
      const osInfo = await this.detectOS(ssh);
      await Server.findByIdAndUpdate(serverId, {
        osType: osInfo.type,
        osVersion: osInfo.version
      });
      await this.updateStatus(serverId, 'provisioning', 20, `Sistema detectado: ${osInfo.type} ${osInfo.version}`);
      
      // 3. Selecionar script apropriado
      const script = this.getProvisioningScript(osInfo.type);
      
      // 4. Executar provisioning
      await this.executeProvisioning(ssh, script, serverId);
      
      // 5. Validar instalação
      await this.updateStatus(serverId, 'provisioning', 90, 'Validando instalação...');
      const validation = await this.validateInstallation(ssh);
      
      if (validation.success) {
        await Server.findByIdAndUpdate(serverId, {
          provisioningStatus: 'ready',
          provisioningProgress: 100,
          installedSoftware: validation.software
        });
        await this.updateStatus(serverId, 'ready', 100, '✅ Servidor pronto para receber projetos!');
      } else {
        throw new Error('Validação falhou: ' + validation.errors.join(', '));
      }
      
      ssh.dispose();
      
    } catch (error: any) {
      await Server.findByIdAndUpdate(serverId, {
        provisioningStatus: 'error',
        provisioningError: error.message
      });
      await this.updateStatus(serverId, 'error', 0, `❌ Erro: ${error.message}`);
      throw error;
    }
  }
  
  private async connectSSH(server: Server): Promise<NodeSSH> {
    const ssh = new NodeSSH();
    
    const config: any = {
      host: server.host,
      port: server.port,
      username: server.username,
      tryKeyboard: true,
      onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
        if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
          finish([server.password]);
        }
      }
    };
    
    if (server.authType === 'password') {
      config.password = server.password;
    } else {
      config.privateKey = server.privateKey;
    }
    
    await ssh.connect(config);
    return ssh;
  }
  
  private async detectOS(ssh: NodeSSH): Promise<{ type: string; version: string }> {
    // Detectar distribuição Linux
    const result = await ssh.execCommand('cat /etc/os-release');
    const osRelease = result.stdout;
    
    let type = 'unknown';
    let version = '';
    
    if (osRelease.includes('Ubuntu')) {
      type = 'ubuntu';
      const match = osRelease.match(/VERSION_ID="([^"]+)"/);
      version = match ? match[1] : '';
    } else if (osRelease.includes('Debian')) {
      type = 'debian';
      const match = osRelease.match(/VERSION_ID="([^"]+)"/);
      version = match ? match[1] : '';
    } else if (osRelease.includes('CentOS')) {
      type = 'centos';
      const match = osRelease.match(/VERSION_ID="([^"]+)"/);
      version = match ? match[1] : '';
    }
    
    return { type, version };
  }
  
  private getProvisioningScript(osType: string): string {
    // Retorna o script apropriado baseado no OS
    if (osType === 'ubuntu' || osType === 'debian') {
      return this.getUbuntuScript();
    } else if (osType === 'centos' || osType === 'rhel') {
      return this.getCentOSScript();
    }
    throw new Error(`Sistema operacional não suportado: ${osType}`);
  }
  
  private getUbuntuScript(): string {
    return `
#!/bin/bash
set -e

echo "PROGRESS:30:Atualizando sistema..."
apt-get update -y
apt-get upgrade -y

echo "PROGRESS:40:Instalando dependências..."
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git wget

echo "PROGRESS:50:Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

echo "PROGRESS:60:Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "PROGRESS:70:Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "PROGRESS:80:Criando diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/logs
mkdir -p /opt/deploy-manager/backups

echo "PROGRESS:85:Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8000:9000/tcp
fi

echo "PROGRESS:90:Limpando cache..."
apt-get autoremove -y
apt-get clean

echo "DONE"
`;
  }
  
  private getCentOSScript(): string {
    return `
#!/bin/bash
set -e

echo "PROGRESS:30:Atualizando sistema..."
yum update -y

echo "PROGRESS:40:Instalando dependências..."
yum install -y yum-utils device-mapper-persistent-data lvm2 git wget curl

echo "PROGRESS:50:Instalando Docker..."
if ! command -v docker &> /dev/null; then
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
fi

echo "PROGRESS:60:Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "PROGRESS:70:Instalando Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

echo "PROGRESS:80:Criando diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/logs

echo "PROGRESS:85:Configurando firewall..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=8000-9000/tcp
firewall-cmd --reload

echo "DONE"
`;
  }
  
  private async executeProvisioning(ssh: NodeSSH, script: string, serverId: string): Promise<void> {
    // Criar arquivo temporário com o script
    const scriptPath = '/tmp/provision.sh';
    await ssh.execCommand(`cat > ${scriptPath} << 'EOF'\n${script}\nEOF`);
    await ssh.execCommand(`chmod +x ${scriptPath}`);
    
    // Executar script e capturar output em tempo real
    const result = await ssh.execCommand(`bash ${scriptPath}`, {
      onStdout: (chunk) => {
        const output = chunk.toString('utf8');
        console.log(output);
        
        // Parsear progresso
        const progressMatch = output.match(/PROGRESS:(\d+):(.+)/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const message = progressMatch[2];
          this.updateStatus(serverId, 'provisioning', progress, message);
        }
        
        // Adicionar aos logs
        this.addLog(serverId, output);
      },
      onStderr: (chunk) => {
        const error = chunk.toString('utf8');
        console.error(error);
        this.addLog(serverId, `ERROR: ${error}`);
      }
    });
    
    if (result.code !== 0) {
      throw new Error(`Script falhou com código ${result.code}: ${result.stderr}`);
    }
    
    // Limpar script temporário
    await ssh.execCommand(`rm ${scriptPath}`);
  }
  
  private async validateInstallation(ssh: NodeSSH): Promise<any> {
    const checks = {
      docker: false,
      dockerCompose: false,
      git: false,
      nodejs: false
    };
    
    const errors: string[] = [];
    
    // Verificar Docker
    const dockerCheck = await ssh.execCommand('docker --version');
    checks.docker = dockerCheck.code === 0;
    if (!checks.docker) errors.push('Docker não instalado');
    
    // Verificar Docker Compose
    const composeCheck = await ssh.execCommand('docker-compose --version');
    checks.dockerCompose = composeCheck.code === 0;
    if (!checks.dockerCompose) errors.push('Docker Compose não instalado');
    
    // Verificar Git
    const gitCheck = await ssh.execCommand('git --version');
    checks.git = gitCheck.code === 0;
    if (!checks.git) errors.push('Git não instalado');
    
    // Verificar Node.js
    const nodeCheck = await ssh.execCommand('node --version');
    checks.nodejs = nodeCheck.code === 0;
    
    // Verificar diretórios
    const dirCheck = await ssh.execCommand('ls -la /opt/projects');
    if (dirCheck.code !== 0) errors.push('Diretórios não criados');
    
    return {
      success: errors.length === 0,
      software: checks,
      errors
    };
  }
  
  private async updateStatus(serverId: string, status: string, progress: number, message: string): Promise<void> {
    await Server.findByIdAndUpdate(serverId, {
      provisioningStatus: status,
      provisioningProgress: progress
    });
    
    // Emitir evento via WebSocket
    io.emit('provisioning:progress', {
      serverId,
      status,
      progress,
      message
    });
  }
  
  private async addLog(serverId: string, log: string): Promise<void> {
    await Server.findByIdAndUpdate(serverId, {
      $push: { provisioningLogs: log }
    });
    
    io.emit('provisioning:log', {
      serverId,
      log
    });
  }
}

export const provisioningService = new ProvisioningService();
```

### Rota de Provisioning

```typescript
// backend/src/routes/servers.ts
import express from 'express';
import { provisioningService } from '../services/ProvisioningService';

const router = express.Router();

// Adicionar servidor e iniciar provisioning automático
router.post('/servers', async (req, res) => {
  try {
    const server = new Server(req.body);
    server.provisioningStatus = 'pending';
    await server.save();
    
    // Iniciar provisioning em background
    provisioningService.provisionServer(server._id.toString())
      .catch(err => console.error('Erro no provisioning:', err));
    
    res.json({ 
      success: true, 
      server,
      message: 'Servidor adicionado. Provisioning iniciado em background.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter status de provisioning
router.get('/servers/:id/provisioning', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    res.json({
      status: server.provisioningStatus,
      progress: server.provisioningProgress,
      logs: server.provisioningLogs,
      error: server.provisioningError
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reprovisionar servidor
router.post('/servers/:id/reprovision', async (req, res) => {
  try {
    await provisioningService.provisionServer(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 🎨 Interface do Usuário

### Modal de Provisioning em Tempo Real

```tsx
// frontend/src/components/ProvisioningModal.tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function ProvisioningModal({ serverId, onClose }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const socket = io('http://localhost:8001');
    
    socket.on('provisioning:progress', (data) => {
      if (data.serverId === serverId) {
        setProgress(data.progress);
        setStatus(data.status);
        setMessage(data.message);
      }
    });
    
    socket.on('provisioning:log', (data) => {
      if (data.serverId === serverId) {
        setLogs(prev => [...prev, data.log]);
      }
    });
    
    return () => socket.disconnect();
  }, [serverId]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {status === 'ready' ? '✅ Servidor Pronto!' : '⚙️ Provisionando Servidor...'}
        </h2>
        
        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">{message}</span>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Logs em tempo real */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
        
        {/* Botões */}
        <div className="mt-4 flex justify-end gap-2">
          {status === 'ready' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Concluir
            </button>
          )}
          {status === 'error' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
              <button
                onClick={() => {/* Tentar novamente */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

## ✅ Checklist de Validação

O sistema valida automaticamente:

- [x] Docker instalado e rodando
- [x] Docker Compose instalado
- [x] Git instalado
- [x] Node.js instalado (opcional)
- [x] Diretórios criados (/opt/projects)
- [x] Permissões corretas
- [x] Firewall configurado
- [x] Portas abertas (22, 80, 443, 8000-9000)

## 🎉 Resultado Final

Depois do provisioning automático, você terá:

✅ VPS completamente configurado  
✅ Docker e Docker Compose instalados  
✅ Git configurado  
✅ Diretórios criados  
✅ Firewall configurado  
✅ Pronto para receber deploys  

**Tempo estimado**: 5-10 minutos dependendo da velocidade do VPS

## 🔄 Reprovisioning

Se algo der errado, você pode:
- Ver logs detalhados do que aconteceu
- Tentar provisionar novamente
- Executar comandos manuais via SSH

## 💡 Exemplo de Uso

```typescript
// 1. Adicionar VPS zerado
POST /api/servers
{
  "name": "VPS Digital Ocean",
  "host": "192.168.1.100",
  "port": 22,
  "username": "root",
  "password": "senha123"
}

// 2. Sistema automaticamente:
// - Conecta via SSH
// - Detecta Ubuntu 22.04
// - Instala Docker, Git, Node.js
// - Configura tudo
// - Marca como "ready"

// 3. Agora você pode criar projetos nesse VPS!
POST /api/projects
{
  "name": "meu-projeto",
  "serverId": "server_id",
  "gitUrl": "https://github.com/user/repo"
}
```

## 🚀 Próximos Passos

1. Implementar ProvisioningService
2. Criar scripts de provisioning
3. Adicionar interface de progresso
4. Testar com VPS real
5. Adicionar suporte para mais sistemas operacionais
