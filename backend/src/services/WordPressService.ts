import { WordPress, IWordPress } from '../models/WordPress';
import { Server } from '../models/Server';
import { sshService } from './SSHService';
import { TraefikService } from './TraefikService';
import crypto from 'crypto';

class WordPressServiceClass {
  /**
   * Gerar senha aleatória forte
   */
  private generatePassword(length: number = 16): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  /**
   * Sanitizar nome para uso em containers/redes
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Gerar domínio automático
   */
  private async generateDomain(name: string, serverId: string): Promise<string> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const sanitized = this.sanitizeName(name);
    const ip = server.host.replace(/\./g, '.');
    
    return `${sanitized}.${ip}.sslip.io`;
  }

  /**
   * Adicionar log de instalação
   */
  private async addLog(wpId: string, message: string): Promise<void> {
    await WordPress.findByIdAndUpdate(wpId, {
      $push: { installationLog: `[${new Date().toISOString()}] ${message}` },
    });
    console.log(`[WordPress ${wpId}] ${message}`);
  }

  /**
   * Instalar WordPress completo
   */
  async install(data: {
    userId: string;
    serverId: string;
    name: string;
    domain?: string;
    wpAdminUser?: string;
    wpAdminPassword?: string;
    wpAdminEmail: string;
  }): Promise<IWordPress> {
    const server = await Server.findById(data.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    // Verificar se já existe WordPress com mesmo nome
    const existing = await WordPress.findOne({
      userId: data.userId,
      name: data.name,
    });
    if (existing) {
      throw new Error('Já existe um WordPress com este nome');
    }

    // Gerar nomes e senhas
    const sanitizedName = this.sanitizeName(data.name);
    const containerName = `wp-${sanitizedName}`;
    const dbContainerName = `wp-${sanitizedName}-db`;
    const networkName = `wp-${sanitizedName}-net`;
    const domain = data.domain || await this.generateDomain(data.name, data.serverId);
    
    const dbName = 'wordpress';
    const dbUser = 'wpuser';
    const dbPassword = this.generatePassword(20);
    const dbRootPassword = this.generatePassword(20);
    const wpAdminUser = data.wpAdminUser || 'admin';
    const wpAdminPassword = data.wpAdminPassword || this.generatePassword(16);

    // Criar registro no banco
    const wordpress = await WordPress.create({
      userId: data.userId,
      serverId: data.serverId,
      name: data.name,
      domain,
      dbName,
      dbUser,
      dbPassword,
      dbRootPassword,
      wpAdminUser,
      wpAdminPassword,
      wpAdminEmail: data.wpAdminEmail,
      containerName,
      dbContainerName,
      networkName,
      status: 'installing',
      installationLog: [],
    });

    // Executar instalação em background
    this.executeInstallation(wordpress._id.toString(), server).catch(async (error) => {
      console.error('Erro na instalação do WordPress:', error);
      await this.addLog(wordpress._id.toString(), `❌ ERRO: ${error.message}`);
      await WordPress.findByIdAndUpdate(wordpress._id, { status: 'error' });
    });

    return wordpress;
  }

  /**
   * Executar instalação (processo assíncrono)
   */
  private async executeInstallation(wpId: string, server: any): Promise<void> {
    const wp = await WordPress.findById(wpId);
    if (!wp) throw new Error('WordPress não encontrado');

    try {
      const ssh = await sshService.connect(server);
      await this.addLog(wpId, '🔌 Conectado ao servidor');

      // 1. Criar rede Docker
      await this.addLog(wpId, '🌐 Criando rede Docker...');
      await ssh.execCommand(`docker network create ${wp.networkName} 2>/dev/null || true`);

      // 2. Criar container MySQL
      await this.addLog(wpId, '🗄️  Criando container MySQL...');
      const mysqlCmd = `docker run -d \
        --name ${wp.dbContainerName} \
        --network ${wp.networkName} \
        -e MYSQL_ROOT_PASSWORD="${wp.dbRootPassword}" \
        -e MYSQL_DATABASE="${wp.dbName}" \
        -e MYSQL_USER="${wp.dbUser}" \
        -e MYSQL_PASSWORD="${wp.dbPassword}" \
        -v ${wp.dbContainerName}-data:/var/lib/mysql \
        --restart unless-stopped \
        mysql:8.0 \
        --default-authentication-plugin=mysql_native_password`;

      const mysqlResult = await ssh.execCommand(mysqlCmd);
      if (mysqlResult.code !== 0) {
        throw new Error(`Erro ao criar MySQL: ${mysqlResult.stderr}`);
      }

      // 3. Aguardar MySQL iniciar
      await this.addLog(wpId, '⏳ Aguardando MySQL iniciar (30s)...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Verificar se MySQL está pronto
      await this.addLog(wpId, '🔍 Verificando MySQL...');
      let mysqlReady = false;
      for (let i = 0; i < 10; i++) {
        const checkResult = await ssh.execCommand(
          `docker exec ${wp.dbContainerName} mysqladmin ping -h localhost -u root -p"${wp.dbRootPassword}" 2>/dev/null`
        );
        if (checkResult.code === 0) {
          mysqlReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (!mysqlReady) {
        throw new Error('MySQL não iniciou corretamente');
      }
      await this.addLog(wpId, '✅ MySQL pronto');

      // 4. Criar container WordPress
      await this.addLog(wpId, '🌐 Criando container WordPress...');
      
      // Detectar rede do Traefik
      // const traefikNetwork = await TraefikService.detectTraefikNetwork(ssh);
      const traefikNetwork = 'traefik-network'; // Fallback padrão
      await this.addLog(wpId, `📡 Rede do Traefik: ${traefikNetwork}`);

      const wpCmd = `docker run -d \
        --name ${wp.containerName} \
        --network ${wp.networkName} \
        -e WORDPRESS_DB_HOST="${wp.dbContainerName}:3306" \
        -e WORDPRESS_DB_USER="${wp.dbUser}" \
        -e WORDPRESS_DB_PASSWORD="${wp.dbPassword}" \
        -e WORDPRESS_DB_NAME="${wp.dbName}" \
        -e WORDPRESS_TABLE_PREFIX="wp_" \
        -e WORDPRESS_DEBUG="false" \
        -v ${wp.containerName}-data:/var/www/html \
        --restart unless-stopped \
        -l "traefik.enable=true" \
        -l "traefik.http.routers.${wp.containerName}.rule=Host(\\\`${wp.domain}\\\`)" \
        -l "traefik.http.routers.${wp.containerName}.entrypoints=web" \
        -l "traefik.http.services.${wp.containerName}.loadbalancer.server.port=80" \
        wordpress:latest`;

      const wpResult = await ssh.execCommand(wpCmd);
      if (wpResult.code !== 0) {
        throw new Error(`Erro ao criar WordPress: ${wpResult.stderr}`);
      }

      // 5. Conectar WordPress à rede do Traefik
      await this.addLog(wpId, `🔗 Conectando à rede ${traefikNetwork}...`);
      await ssh.execCommand(`docker network connect ${traefikNetwork} ${wp.containerName} 2>/dev/null || true`);

      // 6. Aguardar WordPress iniciar
      await this.addLog(wpId, '⏳ Aguardando WordPress iniciar (60s)...');
      await new Promise(resolve => setTimeout(resolve, 60000));

      // 7. Verificar se WordPress está respondendo
      await this.addLog(wpId, '🔍 Verificando WordPress...');
      const checkWp = await ssh.execCommand(
        `docker exec ${wp.containerName} curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000"`
      );
      
      if (checkWp.stdout.trim() === '200' || checkWp.stdout.trim() === '302') {
        await this.addLog(wpId, '✅ WordPress respondendo');
      } else {
        await this.addLog(wpId, `⚠️  WordPress pode não estar pronto (HTTP ${checkWp.stdout.trim()})`);
      }

      // 8. Finalizar
      await WordPress.findByIdAndUpdate(wpId, { status: 'running' });
      await this.addLog(wpId, '🎉 Instalação concluída com sucesso!');
      await this.addLog(wpId, `🌐 Acesse: http://${wp.domain}`);
      await this.addLog(wpId, `🔐 Admin: http://${wp.domain}/wp-admin`);
      await this.addLog(wpId, `👤 Usuário: ${wp.wpAdminUser}`);

    } catch (error: any) {
      await this.addLog(wpId, `❌ ERRO: ${error.message}`);
      await WordPress.findByIdAndUpdate(wpId, { status: 'error' });
      throw error;
    }
  }

  /**
   * Listar WordPress do usuário
   */
  async list(userId: string): Promise<IWordPress[]> {
    return WordPress.find({ userId }).populate('serverId').sort({ createdAt: -1 });
  }

  /**
   * Obter WordPress por ID
   */
  async getById(id: string, userId: string): Promise<IWordPress | null> {
    return WordPress.findOne({ _id: id, userId }).populate('serverId');
  }

  /**
   * Iniciar WordPress
   */
  async start(id: string, userId: string): Promise<void> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    // Iniciar MySQL
    await ssh.execCommand(`docker start ${wp.dbContainerName}`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Iniciar WordPress
    await ssh.execCommand(`docker start ${wp.containerName}`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    await WordPress.findByIdAndUpdate(id, { status: 'running' });
  }

  /**
   * Parar WordPress
   */
  async stop(id: string, userId: string): Promise<void> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    // Parar WordPress
    await ssh.execCommand(`docker stop ${wp.containerName}`);

    // Parar MySQL
    await ssh.execCommand(`docker stop ${wp.dbContainerName}`);

    await WordPress.findByIdAndUpdate(id, { status: 'stopped' });
  }

  /**
   * Reiniciar WordPress
   */
  async restart(id: string, userId: string): Promise<void> {
    await this.stop(id, userId);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.start(id, userId);
  }

  /**
   * Excluir WordPress
   */
  async delete(id: string, userId: string): Promise<void> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    // Parar e remover containers
    await ssh.execCommand(`docker stop ${wp.containerName} ${wp.dbContainerName} 2>/dev/null || true`);
    await ssh.execCommand(`docker rm ${wp.containerName} ${wp.dbContainerName} 2>/dev/null || true`);

    // Remover volumes (CUIDADO: dados serão perdidos!)
    await ssh.execCommand(`docker volume rm ${wp.containerName}-data ${wp.dbContainerName}-data 2>/dev/null || true`);

    // Remover rede
    await ssh.execCommand(`docker network rm ${wp.networkName} 2>/dev/null || true`);

    // Remover do banco
    await WordPress.findByIdAndDelete(id);
  }

  /**
   * Obter logs
   */
  async getLogs(id: string, userId: string, lines: number = 100): Promise<{ wordpress: string; mysql: string }> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    const wpLogs = await ssh.execCommand(`docker logs --tail ${lines} ${wp.containerName} 2>&1`);
    const mysqlLogs = await ssh.execCommand(`docker logs --tail ${lines} ${wp.dbContainerName} 2>&1`);

    return {
      wordpress: wpLogs.stdout || wpLogs.stderr,
      mysql: mysqlLogs.stdout || mysqlLogs.stderr,
    };
  }

  /**
   * Atualizar domínio
   */
  async updateDomain(id: string, userId: string, newDomain: string): Promise<void> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    // Atualizar labels do Traefik
    await ssh.execCommand(`docker stop ${wp.containerName}`);
    await ssh.execCommand(`docker rm ${wp.containerName}`);

    // Recriar container com novo domínio
    // const traefikNetwork = await TraefikService.detectTraefikNetwork(ssh);
    const traefikNetwork = 'traefik-network'; // Fallback padrão
    
    const wpCmd = `docker run -d \
      --name ${wp.containerName} \
      --network ${wp.networkName} \
      -e WORDPRESS_DB_HOST="${wp.dbContainerName}:3306" \
      -e WORDPRESS_DB_USER="${wp.dbUser}" \
      -e WORDPRESS_DB_PASSWORD="${wp.dbPassword}" \
      -e WORDPRESS_DB_NAME="${wp.dbName}" \
      -v ${wp.containerName}-data:/var/www/html \
      --restart unless-stopped \
      -l "traefik.enable=true" \
      -l "traefik.http.routers.${wp.containerName}.rule=Host(\\\`${newDomain}\\\`)" \
      -l "traefik.http.routers.${wp.containerName}.entrypoints=web" \
      -l "traefik.http.services.${wp.containerName}.loadbalancer.server.port=80" \
      wordpress:latest`;

    await ssh.execCommand(wpCmd);
    await ssh.execCommand(`docker network connect ${traefikNetwork} ${wp.containerName} 2>/dev/null || true`);

    // Atualizar no banco
    await WordPress.findByIdAndUpdate(id, { domain: newDomain });
  }

  /**
   * Obter status dos containers
   */
  async getStatus(id: string, userId: string): Promise<{ wordpress: string; mysql: string }> {
    const wp = await WordPress.findOne({ _id: id, userId }).populate('serverId');
    if (!wp) throw new Error('WordPress não encontrado');

    const server = await Server.findById(wp.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    const wpStatus = await ssh.execCommand(`docker inspect -f '{{.State.Status}}' ${wp.containerName} 2>/dev/null || echo "not found"`);
    const mysqlStatus = await ssh.execCommand(`docker inspect -f '{{.State.Status}}' ${wp.dbContainerName} 2>/dev/null || echo "not found"`);

    return {
      wordpress: wpStatus.stdout.trim(),
      mysql: mysqlStatus.stdout.trim(),
    };
  }
}

export const WordPressService = new WordPressServiceClass();
