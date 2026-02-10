/**
 * Serviço para gerenciar integração com Traefik
 * Gera labels do Traefik para containers Docker
 */

export interface TraefikLabels {
  [key: string]: string;
}

export class TraefikService {
  /**
   * Gera labels do Traefik para um container
   */
  static async generateLabels(
    domain: string,
    containerPort: number,
    projectName: string,
    enableSSL: boolean = false
  ): Promise<TraefikLabels> {
    const routerName = projectName.replace(/[^a-z0-9]/g, '');
    const networkName = await this.detectNetwork();
    
    const labels: TraefikLabels = {
      // Habilitar Traefik
      'traefik.enable': 'true',
      
      // Configurar roteador HTTP
      [`traefik.http.routers.${routerName}.rule`]: `Host(\`${domain}\`)`,
      [`traefik.http.routers.${routerName}.entrypoints`]: 'web',
      
      // Configurar serviço
      [`traefik.http.services.${routerName}.loadbalancer.server.port`]: containerPort.toString(),
      
      // Rede (coolify se existir, senão deploy-manager)
      'traefik.docker.network': networkName,
    };

    // Se SSL habilitado, adicionar configuração HTTPS
    if (enableSSL) {
      labels[`traefik.http.routers.${routerName}.entrypoints`] = 'websecure';
      labels[`traefik.http.routers.${routerName}.tls`] = 'true';
      labels[`traefik.http.routers.${routerName}.tls.certresolver`] = 'letsencrypt';
      
      // Redirecionar HTTP para HTTPS
      labels[`traefik.http.routers.${routerName}-http.rule`] = `Host(\`${domain}\`)`;
      labels[`traefik.http.routers.${routerName}-http.entrypoints`] = 'web';
      labels[`traefik.http.routers.${routerName}-http.middlewares`] = `${routerName}-redirect`;
      labels[`traefik.http.middlewares.${routerName}-redirect.redirectscheme.scheme`] = 'https';
      labels[`traefik.http.middlewares.${routerName}-redirect.redirectscheme.permanent`] = 'true';
    }

    return labels;
  }

  /**
   * Converte labels para formato de linha de comando Docker
   */
  static labelsToDockerArgs(labels: TraefikLabels): string[] {
    return Object.entries(labels).map(([key, value]) => `--label "${key}=${value}"`);
  }

  /**
   * Converte labels para formato docker-compose
   */
  static labelsToComposeFormat(labels: TraefikLabels): string[] {
    return Object.entries(labels).map(([key, value]) => `      - "${key}=${value}"`);
  }

  /**
   * Verifica se Traefik está rodando
   * @param ssh Conexão SSH para executar comandos remotamente (opcional)
   */
  static async isTraefikRunning(ssh?: any): Promise<boolean> {
    try {
      const cmd = 'docker ps --filter "name=traefik" --format "{{.Names}}"';
      
      if (ssh) {
        const result = await ssh.execCommand(cmd);
        return result.stdout.trim().length > 0;
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(cmd);
        return stdout.trim().length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta qual rede usar (coolify se existir, senão deploy-manager)
   * @param ssh Conexão SSH para executar comandos remotamente (opcional)
   */
  static async detectNetwork(ssh?: any): Promise<string> {
    try {
      const cmd = 'docker network ls --filter "name=coolify" --format "{{.Name}}"';
      
      if (ssh) {
        const result = await ssh.execCommand(cmd);
        if (result.stdout.includes('coolify')) {
          console.log('✅ Usando rede existente: coolify');
          return 'coolify';
        }
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(cmd);
        if (stdout.includes('coolify')) {
          console.log('✅ Usando rede existente: coolify');
          return 'coolify';
        }
      }
    } catch (error) {
      // Ignorar erro
    }

    console.log('✅ Usando rede própria: deploy-manager');
    return 'deploy-manager';
  }

  /**
   * Verifica se rede existe
   * @param ssh Conexão SSH para executar comandos remotamente (opcional)
   */
  static async checkNetwork(networkName: string, ssh?: any): Promise<boolean> {
    try {
      const cmd = `docker network ls --filter "name=${networkName}" --format "{{.Name}}"`;
      
      if (ssh) {
        const result = await ssh.execCommand(cmd);
        return result.stdout.includes(networkName);
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(cmd);
        return stdout.includes(networkName);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Cria rede se não existir
   * @param ssh Conexão SSH para executar comandos remotamente (opcional)
   */
  static async ensureNetwork(networkName: string, ssh?: any): Promise<void> {
    const networkExists = await this.checkNetwork(networkName, ssh);
    
    if (!networkExists) {
      try {
        const cmd = `docker network create ${networkName}`;
        
        if (ssh) {
          await ssh.execCommand(cmd);
        } else {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          await execAsync(cmd);
        }
        
        console.log(`✅ Rede ${networkName} criada`);
      } catch (error: any) {
        // Ignorar erro se rede já existe
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  }

  /**
   * Gera comando docker run completo com labels do Traefik
   */
  static async generateDockerRunCommand(
    containerName: string,
    imageName: string,
    domain: string,
    containerPort: number,
    projectName: string,
    envVars: Record<string, string> = {},
    enableSSL: boolean = false
  ): Promise<string> {
    const labels = await this.generateLabels(domain, containerPort, projectName, enableSSL);
    const networkName = await this.detectNetwork();
    const labelArgs = this.labelsToDockerArgs(labels);
    
    const envArgs = Object.entries(envVars)
      .map(([key, value]) => `-e "${key}=${value}"`)
      .join(' ');

    return `docker run -d \\
  --name ${containerName} \\
  --network ${networkName} \\
  ${labelArgs.join(' \\\n  ')} \\
  ${envArgs ? envArgs + ' \\' : ''}
  --restart unless-stopped \\
  ${imageName}`;
  }

  /**
   * Gera docker-compose.yml com labels do Traefik
   */
  static async generateDockerCompose(
    serviceName: string,
    imageName: string,
    domain: string,
    containerPort: number,
    projectName: string,
    envVars: Record<string, string> = {},
    enableSSL: boolean = false
  ): Promise<string> {
    const labels = await this.generateLabels(domain, containerPort, projectName, enableSSL);
    const networkName = await this.detectNetwork();
    const labelLines = this.labelsToComposeFormat(labels);
    
    const envLines = Object.entries(envVars)
      .map(([key, value]) => `      - ${key}=${value}`)
      .join('\n');

    return `version: '3.8'

services:
  ${serviceName}:
    image: ${imageName}
    container_name: ${serviceName}
    networks:
      - ${networkName}
    restart: unless-stopped
    labels:
${labelLines.join('\n')}
${envLines ? `    environment:\n${envLines}` : ''}

networks:
  ${networkName}:
    external: true
`;
  }

  /**
   * Detecta modo de proxy (Traefik ou Nginx)
   */
  static async detectProxyMode(): Promise<'traefik' | 'nginx' | 'none'> {
    const traefikRunning = await this.isTraefikRunning();
    
    if (traefikRunning) {
      return 'traefik';
    }

    // Verificar se Nginx está instalado
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('which nginx');
      return 'nginx';
    } catch {
      return 'none';
    }
  }

  /**
   * Instala e configura Traefik automaticamente
   * @param ssh Conexão SSH para executar comandos remotamente (opcional)
   */
  static async setupTraefik(ssh?: any): Promise<void> {
    console.log('🔧 Verificando Traefik...');

    const isRunning = await this.isTraefikRunning(ssh);
    
    if (isRunning) {
      console.log('✅ Traefik já está rodando');
      return;
    }

    console.log('📦 Traefik não encontrado. Instalando...');

    try {
      // 1. Detectar e criar rede
      const networkName = await this.detectNetwork(ssh);
      await this.ensureNetwork(networkName, ssh);

      // 2. Criar diretório para configurações
      const mkdirCmd = 'mkdir -p /opt/traefik';
      if (ssh) {
        await ssh.execCommand(mkdirCmd);
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(mkdirCmd);
      }

      // 3. Criar arquivo de configuração do Traefik
      const traefikConfig = `# Traefik Configuration - Deploy Manager
[global]
  checkNewVersion = false
  sendAnonymousUsage = false

[log]
  level = "INFO"

[api]
  dashboard = true
  insecure = true

[entryPoints]
  [entryPoints.web]
    address = ":80"
  [entryPoints.websecure]
    address = ":443"

[providers]
  [providers.docker]
    endpoint = "unix:///var/run/docker.sock"
    exposedByDefault = false
    network = "${networkName}"
    watch = true

[certificatesResolvers.letsencrypt.acme]
  email = "admin@localhost"
  storage = "/letsencrypt/acme.json"
  [certificatesResolvers.letsencrypt.acme.httpChallenge]
    entryPoint = "web"
`;

      const configCmd = `cat > /opt/traefik/traefik.toml << 'EOF'\n${traefikConfig}\nEOF`;
      if (ssh) {
        await ssh.execCommand(configCmd);
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(configCmd);
      }

      // 4. Criar diretório para certificados SSL
      const sslCmds = [
        'mkdir -p /opt/traefik/letsencrypt',
        'touch /opt/traefik/letsencrypt/acme.json',
        'chmod 600 /opt/traefik/letsencrypt/acme.json'
      ];

      for (const cmd of sslCmds) {
        if (ssh) {
          await ssh.execCommand(cmd);
        } else {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          await execAsync(cmd);
        }
      }

      // 5. Iniciar Traefik
      const dockerCommand = `docker run -d \\
  --name traefik-proxy \\
  --restart unless-stopped \\
  --network ${networkName} \\
  -p 80:80 \\
  -p 443:443 \\
  -p 8080:8080 \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  -v /opt/traefik/traefik.toml:/etc/traefik/traefik.toml:ro \\
  -v /opt/traefik/letsencrypt:/letsencrypt \\
  traefik:v2.10`;

      if (ssh) {
        await ssh.execCommand(dockerCommand);
      } else {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(dockerCommand);
      }

      console.log('✅ Traefik instalado e iniciado com sucesso!');
      console.log(`📊 Dashboard disponível em: http://SEU_IP:8080`);
      console.log(`🌐 Rede utilizada: ${networkName}`);
      
      // Aguardar Traefik iniciar
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error: any) {
      console.error('❌ Erro ao instalar Traefik:', error.message);
      throw new Error(`Falha ao instalar Traefik: ${error.message}`);
    }
  }

  /**
   * Verifica e configura Traefik automaticamente
   * Retorna true se Traefik está pronto para uso
   */
  static async ensureTraefik(): Promise<boolean> {
    try {
      const isRunning = await this.isTraefikRunning();
      
      if (!isRunning) {
        console.log('⚠️  Traefik não está rodando. Instalando automaticamente...');
        await this.setupTraefik();
      }

      // Garantir que a rede existe
      const networkName = await this.detectNetwork();
      await this.ensureNetwork(networkName);

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao configurar Traefik:', error.message);
      return false;
    }
  }
}
