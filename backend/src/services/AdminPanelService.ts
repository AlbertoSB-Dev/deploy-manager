import { NodeSSH } from 'node-ssh';
import Database, { IDatabase, DatabaseType } from '../models/Database';
import { Server } from '../models/Server';
import { sshService } from './SSHService';

export class AdminPanelService {
  /**
   * Criar painel admin para banco de dados
   */
  async createAdminPanel(databaseId: string, io?: any): Promise<void> {
    const emitLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      console.log(message);
      if (io) {
        io.to(`admin-panel-${databaseId}`).emit('admin-panel-log', { message, type, timestamp: new Date() });
      }
    };

    emitLog('🎨 Criando painel administrativo...', 'info');

    const database = await Database.findById(databaseId);
    if (!database) throw new Error('Banco de dados não encontrado');

    const server = await Server.findById(database.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    // MinIO já tem console integrado, apenas atualizar URL
    if (database.type === 'minio') {
      emitLog('✅ MinIO Console já configurado', 'success');
      database.adminPanel = {
        enabled: true,
        type: 'minio-console',
        domain: `minio-console-${database.name}.${server.host}.sslip.io`,
        port: 9001
      };
      database.adminUrl = `http://minio-console-${database.name}.${server.host}.sslip.io`;
      await database.save();
      return;
    }

    const ssh = await sshService.connect(server);

    try {
      // Gerar domínio
      const domain = this.generateAdminDomain(database, server);
      emitLog(`🌐 Domínio gerado: ${domain}`, 'info');

      // Criar container do painel
      emitLog('🐳 Criando container do painel...', 'info');
      const containerId = await this.deployAdminPanel(database, domain, ssh, server);
      emitLog(`✅ Container criado: ${containerId.substring(0, 12)}`, 'success');

      // Atualizar banco de dados
      database.adminPanel = {
        enabled: true,
        type: this.getAdminPanelType(database.type),
        containerId,
        domain,
        port: this.getAdminPanelPort(database.type)
      };
      database.adminUrl = `http://${domain}`;

      await database.save();
      emitLog('🎉 Painel administrativo criado com sucesso!', 'success');
    } catch (error: any) {
      emitLog(`❌ Erro ao criar painel: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Deletar painel admin
   */
  async deleteAdminPanel(databaseId: string): Promise<void> {
    const database = await Database.findById(databaseId);
    if (!database || !database.adminPanel?.enabled) {
      return;
    }

    // MinIO não tem container separado
    if (database.type === 'minio') {
      database.adminPanel = undefined;
      database.adminUrl = undefined;
      await database.save();
      return;
    }

    const server = await Server.findById(database.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);

    try {
      const containerId = database.adminPanel.containerId;
      if (containerId) {
        // Parar container
        await ssh.execCommand(`docker stop ${containerId} || true`);
        // Remover container
        await ssh.execCommand(`docker rm ${containerId} || true`);
      }

      database.adminPanel = undefined;
      database.adminUrl = undefined;
      await database.save();

      console.log('✅ Painel administrativo deletado');
    } catch (error: any) {
      console.error('❌ Erro ao deletar painel:', error.message);
      throw error;
    }
  }

  /**
   * Gerar domínio para painel admin
   */
  private generateAdminDomain(database: IDatabase, server: any): string {
    const prefix = this.getAdminPanelPrefix(database.type);
    return `${prefix}-${database.name}.${server.host}.sslip.io`;
  }

  /**
   * Obter prefixo do painel
   */
  private getAdminPanelPrefix(type: DatabaseType): string {
    const prefixes: Record<DatabaseType, string> = {
      mysql: 'phpmyadmin',
      mariadb: 'phpmyadmin',
      postgresql: 'adminer',
      mongodb: 'mongo-express',
      redis: 'redis-commander',
      minio: 'minio-console'
    };
    return prefixes[type];
  }

  /**
   * Obter tipo do painel
   */
  private getAdminPanelType(type: DatabaseType): 'phpmyadmin' | 'adminer' | 'mongo-express' | 'redis-commander' | 'minio-console' {
    const types: Record<DatabaseType, 'phpmyadmin' | 'adminer' | 'mongo-express' | 'redis-commander' | 'minio-console'> = {
      mysql: 'phpmyadmin',
      mariadb: 'phpmyadmin',
      postgresql: 'adminer',
      mongodb: 'mongo-express',
      redis: 'redis-commander',
      minio: 'minio-console'
    };
    return types[type];
  }

  /**
   * Obter porta do painel
   */
  private getAdminPanelPort(type: DatabaseType): number {
    const ports: Record<DatabaseType, number> = {
      mysql: 80,
      mariadb: 80,
      postgresql: 8080,
      mongodb: 8081,
      redis: 8081,
      minio: 9001
    };
    return ports[type];
  }

  /**
   * Deploy do painel admin
   */
  private async deployAdminPanel(
    database: IDatabase,
    domain: string,
    ssh: NodeSSH,
    server: any
  ): Promise<string> {
    let command: string;

    switch (database.type) {
      case 'mysql':
      case 'mariadb':
        command = this.generatePhpMyAdminCommand(database, domain);
        break;
      case 'postgresql':
        command = this.generateAdminerCommand(database, domain);
        break;
      case 'mongodb':
        command = this.generateMongoExpressCommand(database, domain);
        break;
      case 'redis':
        command = this.generateRedisCommanderCommand(database, domain);
        break;
      default:
        throw new Error(`Painel admin não suportado para ${database.type}`);
    }

    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao criar painel admin: ${result.stderr}`);
    }

    return result.stdout.trim();
  }

  /**
   * Gerar comando phpMyAdmin
   */
  private generatePhpMyAdminCommand(database: IDatabase, domain: string): string {
    const containerName = `phpmyadmin-${database.name}`;

    return `
      docker run -d \
        --name ${containerName} \
        --network traefik-network \
        --restart unless-stopped \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${containerName}.rule=Host(\\\`${domain}\\\`)" \
        --label "traefik.http.services.${containerName}.loadbalancer.server.port=80" \
        -e PMA_HOST=${database.containerId} \
        -e PMA_PORT=${database.port} \
        -e PMA_USER=${database.username} \
        -e PMA_PASSWORD=${database.password} \
        phpmyadmin/phpmyadmin:latest && docker ps -lq
    `.trim().replace(/\s+/g, ' ');
  }

  /**
   * Gerar comando Adminer
   */
  private generateAdminerCommand(database: IDatabase, domain: string): string {
    const containerName = `adminer-${database.name}`;

    return `
      docker run -d \
        --name ${containerName} \
        --network traefik-network \
        --restart unless-stopped \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${containerName}.rule=Host(\\\`${domain}\\\`)" \
        --label "traefik.http.services.${containerName}.loadbalancer.server.port=8080" \
        -e ADMINER_DEFAULT_SERVER=${database.containerId} \
        adminer:latest && docker ps -lq
    `.trim().replace(/\s+/g, ' ');
  }

  /**
   * Gerar comando Mongo Express
   */
  private generateMongoExpressCommand(database: IDatabase, domain: string): string {
    const containerName = `mongo-express-${database.name}`;

    return `
      docker run -d \
        --name ${containerName} \
        --network traefik-network \
        --restart unless-stopped \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${containerName}.rule=Host(\\\`${domain}\\\`)" \
        --label "traefik.http.services.${containerName}.loadbalancer.server.port=8081" \
        -e ME_CONFIG_MONGODB_SERVER=${database.containerId} \
        -e ME_CONFIG_MONGODB_PORT=${database.port} \
        -e ME_CONFIG_MONGODB_ADMINUSERNAME=${database.username} \
        -e ME_CONFIG_MONGODB_ADMINPASSWORD=${database.password} \
        -e ME_CONFIG_BASICAUTH_USERNAME=admin \
        -e ME_CONFIG_BASICAUTH_PASSWORD=${database.password} \
        mongo-express:latest && docker ps -lq
    `.trim().replace(/\s+/g, ' ');
  }

  /**
   * Gerar comando Redis Commander
   */
  private generateRedisCommanderCommand(database: IDatabase, domain: string): string {
    const containerName = `redis-commander-${database.name}`;

    return `
      docker run -d \
        --name ${containerName} \
        --network traefik-network \
        --restart unless-stopped \
        --label "traefik.enable=true" \
        --label "traefik.http.routers.${containerName}.rule=Host(\\\`${domain}\\\`)" \
        --label "traefik.http.services.${containerName}.loadbalancer.server.port=8081" \
        -e REDIS_HOSTS=local:${database.containerId}:${database.port}:0:${database.password} \
        rediscommander/redis-commander:latest && docker ps -lq
    `.trim().replace(/\s+/g, ' ');
  }
}

export const adminPanelService = new AdminPanelService();
