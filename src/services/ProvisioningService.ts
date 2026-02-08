import { NodeSSH } from 'node-ssh';
import { Server, IServer } from '../models/Server';
import { sshService } from './SSHService';

class ProvisioningService {
  
  async provisionServer(serverId: string, io?: any): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error('Servidor não encontrado');
    }

    try {
      // Atualizar status
      await this.updateStatus(serverId, 'provisioning', 0, 'Conectando ao servidor...', io);
      
      // 1. Conectar via SSH
      const ssh = await sshService.connect(server);
      await this.updateStatus(serverId, 'provisioning', 10, '✅ Conectado! Detectando sistema operacional...', io);
      
      // 2. Detectar sistema operacional
      const osInfo = await this.detectOS(ssh, serverId);
      await Server.findByIdAndUpdate(serverId, {
        osType: osInfo.type,
        osVersion: osInfo.version
      });
      await this.updateStatus(serverId, 'provisioning', 20, `✅ Sistema detectado: ${osInfo.type} ${osInfo.version}`, io);
      
      // 3. Selecionar script apropriado
      const script = this.getProvisioningScript(osInfo.type);
      
      // 4. Executar provisioning
      await this.executeProvisioning(ssh, script, serverId, io);
      
      // 5. Validar instalação
      await this.updateStatus(serverId, 'provisioning', 90, '🔍 Validando instalação...', io);
      const validation = await this.validateInstallation(ssh, serverId);
      
      if (validation.success) {
        await Server.findByIdAndUpdate(serverId, {
          provisioningStatus: 'ready',
          provisioningProgress: 100,
          installedSoftware: validation.software,
          status: 'online'
        });
        await this.updateStatus(serverId, 'ready', 100, '🎉 Servidor pronto para receber projetos!', io);
      } else {
        throw new Error('Validação falhou: ' + validation.errors.join(', '));
      }
      
    } catch (error: any) {
      console.error('Erro no provisioning:', error);
      await Server.findByIdAndUpdate(serverId, {
        provisioningStatus: 'error',
        provisioningError: error.message,
        status: 'error'
      });
      await this.updateStatus(serverId, 'error', 0, `❌ Erro: ${error.message}`, io);
      throw error;
    }
  }
  
  private async detectOS(ssh: NodeSSH, serverId: string): Promise<{ type: string; version: string }> {
    try {
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
      } else if (osRelease.includes('CentOS') || osRelease.includes('Red Hat')) {
        type = 'centos';
        const match = osRelease.match(/VERSION_ID="([^"]+)"/);
        version = match ? match[1] : '';
      }
      
      return { type, version };
    } catch (error: any) {
      throw new Error(`Erro ao detectar sistema operacional: ${error.message}`);
    }
  }
  
  private getProvisioningScript(osType: string): string {
    if (osType === 'ubuntu' || osType === 'debian') {
      return this.getUbuntuScript();
    } else if (osType === 'centos' || osType === 'rhel') {
      return this.getCentOSScript();
    }
    throw new Error(`Sistema operacional não suportado: ${osType}`);
  }
  
  private getUbuntuScript(): string {
    return `#!/bin/bash
set -e

echo "PROGRESS:30:📦 Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "PROGRESS:40:🔧 Instalando dependências básicas..."
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git wget unzip

echo "PROGRESS:50:🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

echo "PROGRESS:60:🐳 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/\${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado"
else
    echo "✅ Docker Compose já instalado"
fi

echo "PROGRESS:70:📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js instalado"
else
    echo "✅ Node.js já instalado"
fi

echo "PROGRESS:80:📁 Criando estrutura de diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/logs
mkdir -p /opt/deploy-manager/backups
chmod 755 /opt/projects
chmod 755 /opt/deploy-manager

echo "PROGRESS:85:🔥 Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8000:9000/tcp
    echo "✅ Firewall configurado"
fi

echo "PROGRESS:90:🧹 Limpando cache..."
apt-get autoremove -y
apt-get clean

echo "DONE"
`;
  }
  
  private getCentOSScript(): string {
    return `#!/bin/bash
set -e

echo "PROGRESS:30:📦 Atualizando sistema..."
yum update -y

echo "PROGRESS:40:🔧 Instalando dependências..."
yum install -y yum-utils device-mapper-persistent-data lvm2 git wget curl

echo "PROGRESS:50:🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker instalado"
fi

echo "PROGRESS:60:🐳 Instalando Docker Compose..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\\" -f4)
curl -L "https://github.com/docker/compose/releases/download/\${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "PROGRESS:70:📦 Instalando Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

echo "PROGRESS:80:📁 Criando diretórios..."
mkdir -p /opt/projects
mkdir -p /opt/deploy-manager/logs

echo "PROGRESS:85:🔥 Configurando firewall..."
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=8000-9000/tcp
firewall-cmd --reload

echo "DONE"
`;
  }
  
  private async executeProvisioning(ssh: NodeSSH, script: string, serverId: string, io?: any): Promise<void> {
    const scriptPath = '/tmp/provision.sh';
    
    // Criar arquivo com o script
    await ssh.execCommand(`cat > ${scriptPath} << 'EOFSCRIPT'\n${script}\nEOFSCRIPT`);
    await ssh.execCommand(`chmod +x ${scriptPath}`);
    
    // Executar script
    const result = await ssh.execCommand(`bash ${scriptPath}`, {
      onStdout: (chunk) => {
        const output = chunk.toString('utf8');
        console.log(output);
        
        // Parsear progresso
        const progressMatch = output.match(/PROGRESS:(\d+):(.+)/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const message = progressMatch[2];
          this.updateStatus(serverId, 'provisioning', progress, message, io);
        }
        
        // Adicionar aos logs
        this.addLog(serverId, output, io);
      },
      onStderr: (chunk) => {
        const error = chunk.toString('utf8');
        console.error(error);
        this.addLog(serverId, `ERROR: ${error}`, io);
      }
    });
    
    if (result.code !== 0) {
      throw new Error(`Script falhou com código ${result.code}: ${result.stderr}`);
    }
    
    // Limpar script
    await ssh.execCommand(`rm ${scriptPath}`);
  }
  
  private async validateInstallation(ssh: NodeSSH, serverId: string): Promise<any> {
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
  
  private async updateStatus(serverId: string, status: string, progress: number, message: string, io?: any): Promise<void> {
    await Server.findByIdAndUpdate(serverId, {
      provisioningStatus: status,
      provisioningProgress: progress
    });
    
    // Emitir evento via WebSocket
    if (io) {
      io.emit('provisioning:progress', {
        serverId,
        status,
        progress,
        message
      });
    }
  }
  
  private async addLog(serverId: string, log: string, io?: any): Promise<void> {
    await Server.findByIdAndUpdate(serverId, {
      $push: { provisioningLogs: log }
    });
    
    if (io) {
      io.emit('provisioning:log', {
        serverId,
        log
      });
    }
  }
}

export const provisioningService = new ProvisioningService();
