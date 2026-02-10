import { NodeSSH } from 'node-ssh';
import Database, { IDatabase, DatabaseType } from '../models/Database';
import { Server } from '../models/Server';
import { sshService } from './SSHService';
import crypto from 'crypto';

interface CreateDatabaseConfig {
  name: string;
  displayName: string;
  type: DatabaseType;
  version: string;
  serverId: string;
}

export class DatabaseService {
  /**
   * Gerar senha segura
   */
  private generateSecurePassword(): string {
    return crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
  }

  /**
   * Gerar string aleatória
   */
  private generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * Obter porta padrão para cada tipo de banco
   */
  private getDefaultPort(type: DatabaseType): number {
    const ports = {
      mongodb: 27017,
      mysql: 3306,
      mariadb: 3306,
      postgresql: 5432,
      redis: 6379,
      minio: 9000
    };
    return ports[type];
  }

  /**
   * Gerar comando Docker para criar banco
   */
  private async generateDockerCommand(
    config: CreateDatabaseConfig,
    username: string,
    password: string,
    database: string
  ): Promise<string> {
    const { name, type, version } = config;
    const volumePath = `/opt/databases/${name}`;

    switch (type) {
      case 'mongodb':
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=${username} \
            -e MONGO_INITDB_ROOT_PASSWORD=${password} \
            -e MONGO_INITDB_DATABASE=${database} \
            -v ${volumePath}:/data/db \
            mongo:${version}
        `.trim().replace(/\s+/g, ' ');

      case 'mysql':
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            -p 3306:3306 \
            -e MYSQL_ROOT_PASSWORD=${password} \
            -e MYSQL_DATABASE=${database} \
            -e MYSQL_USER=${username} \
            -e MYSQL_PASSWORD=${password} \
            -v ${volumePath}:/var/lib/mysql \
            mysql:${version}
        `.trim().replace(/\s+/g, ' ');

      case 'mariadb':
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            -p 3306:3306 \
            -e MARIADB_ROOT_PASSWORD=${password} \
            -e MARIADB_DATABASE=${database} \
            -e MARIADB_USER=${username} \
            -e MARIADB_PASSWORD=${password} \
            -v ${volumePath}:/var/lib/mysql \
            mariadb:${version}
        `.trim().replace(/\s+/g, ' ');

      case 'postgresql':
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            -p 5432:5432 \
            -e POSTGRES_USER=${username} \
            -e POSTGRES_PASSWORD=${password} \
            -e POSTGRES_DB=${database} \
            -v ${volumePath}:/var/lib/postgresql/data \
            postgres:${version}
        `.trim().replace(/\s+/g, ' ');

      case 'redis':
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            -p 6379:6379 \
            -v ${volumePath}:/data \
            redis:${version}-alpine redis-server --requirepass ${password}
        `.trim().replace(/\s+/g, ' ');

      case 'minio':
        const consolePort = 9001;
        const server = await Server.findById(config.serverId);
        const apiDomain = `minio-api-${name}.${server?.host}.sslip.io`;
        const consoleDomain = `minio-console-${name}.${server?.host}.sslip.io`;
        
        return `
          docker run -d \
            --name ${name} \
            --restart unless-stopped \
            --network traefik-network \
            --label "traefik.enable=true" \
            --label "traefik.http.routers.${name}-api.rule=Host(\\\`${apiDomain}\\\`)" \
            --label "traefik.http.routers.${name}-api.service=${name}-api" \
            --label "traefik.http.services.${name}-api.loadbalancer.server.port=9000" \
            --label "traefik.http.routers.${name}-console.rule=Host(\\\`${consoleDomain}\\\`)" \
            --label "traefik.http.routers.${name}-console.service=${name}-console" \
            --label "traefik.http.services.${name}-console.loadbalancer.server.port=9001" \
            -e MINIO_ROOT_USER=${username} \
            -e MINIO_ROOT_PASSWORD=${password} \
            -v ${volumePath}:/data \
            minio/minio:${version} server /data --console-address ":9001"
        `.trim().replace(/\s+/g, ' ');

      default:
        throw new Error(`Tipo de banco não suportado: ${type}`);
    }
  }

  /**
   * Gerar connection string
   */
  private generateConnectionString(
    type: DatabaseType,
    host: string,
    port: number,
    username: string,
    password: string,
    database: string
  ): string {
    switch (type) {
      case 'mongodb':
        return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
      
      case 'mysql':
      case 'mariadb':
        return `mysql://${username}:${password}@${host}:${port}/${database}`;
      
      case 'postgresql':
        return `postgresql://${username}:${password}@${host}:${port}/${database}`;
      
      case 'redis':
        return `redis://:${password}@${host}:${port}`;
      
      case 'minio':
        return `http://${host}:${port}`;
      
      default:
        return '';
    }
  }

  /**
   * Aguardar container iniciar
   */
  private async waitForContainer(ssh: NodeSSH, containerId: string, maxWait: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const result = await ssh.execCommand(`docker inspect --format='{{.State.Running}}' ${containerId}`);
      
      if (result.stdout.trim() === 'true') {
        // Aguardar mais 2 segundos para garantir que está estável
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Container não iniciou no tempo esperado');
  }

  /**
   * Criar banco de dados no servidor remoto
   */
  async createDatabase(config: CreateDatabaseConfig, io?: any): Promise<IDatabase> {
    const emitLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      console.log(message);
      if (io) {
        io.to(`database-${config.name}`).emit('database-log', { message, type, timestamp: new Date() });
      }
    };

    emitLog(`🗄️  Criando banco de dados ${config.name}...`, 'info');
    
    // 1. Buscar servidor
    const server = await Server.findById(config.serverId);
    if (!server) {
      emitLog('❌ Servidor não encontrado', 'error');
      throw new Error('Servidor não encontrado');
    }

    // 2. Conectar via SSH
    emitLog(`🔌 Conectando ao servidor ${server.name}...`, 'info');
    const ssh = await sshService.connect(server);
    emitLog(`✅ Conectado ao servidor ${server.host}`, 'success');

    // 3. Gerar credenciais seguras
    const username = `admin_${this.generateRandomString(6)}`;
    const password = this.generateSecurePassword();
    const database = config.name.replace(/-/g, '_');
    
    emitLog(`🔐 Credenciais geradas`, 'success');

    try {
      // 4. Criar diretório para dados
      emitLog(`📁 Criando diretório de dados...`, 'info');
      const volumePath = `/opt/databases/${config.name}`;
      await ssh.execCommand(`mkdir -p ${volumePath}`);
      emitLog(`✅ Diretório criado: ${volumePath}`, 'success');

      // 5. Criar container Docker
      emitLog(`🐳 Criando container Docker...`, 'info');
      emitLog(`📦 Tipo: ${config.type.toUpperCase()} v${config.version}`, 'info');
      
      const dockerCommand = await this.generateDockerCommand(config, username, password, database);
      const result = await ssh.execCommand(dockerCommand);

      if (result.code !== 0) {
        emitLog(`❌ Erro ao criar container: ${result.stderr}`, 'error');
        throw new Error(`Erro ao criar container: ${result.stderr}`);
      }

      const containerId = result.stdout.trim();
      emitLog(`✅ Container criado: ${containerId.substring(0, 12)}`, 'success');

      // 6. Aguardar container iniciar
      emitLog(`⏳ Aguardando container iniciar...`, 'info');
      await this.waitForContainer(ssh, containerId);
      emitLog(`✅ Container iniciado com sucesso`, 'success');

      // 7. Gerar connection string
      const port = this.getDefaultPort(config.type);
      const connectionString = this.generateConnectionString(
        config.type,
        server.host,
        port,
        username,
        password,
        database
      );

      // 8. Preparar dados específicos do MinIO
      const minioData = config.type === 'minio' ? {
        consolePort: 9001,
        accessKey: username,
        secretKey: password,
        apiUrl: `http://minio-api-${config.name}.${server.host}.sslip.io`,
        consoleUrl: `http://minio-console-${config.name}.${server.host}.sslip.io`
      } : {};

      // 9. Salvar no banco
      emitLog(`💾 Salvando configuração...`, 'info');
      const db = new Database({
        name: config.name,
        displayName: config.displayName,
        type: config.type,
        version: config.version,
        serverId: server._id,
        serverName: server.name,
        host: server.host,
        port,
        username,
        password,
        database,
        containerId,
        volumePath,
        status: 'running',
        connectionString,
        ...minioData
      });

      await db.save();
      
      emitLog(`🎉 Banco de dados criado com sucesso!`, 'success');
      emitLog(`📋 Connection String: ${connectionString}`, 'info');
      
      return db;

    } catch (error: any) {
      emitLog(`❌ Erro ao criar banco: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Listar todos os bancos de dados
   */
  async listDatabases(): Promise<IDatabase[]> {
    return Database.find().sort({ createdAt: -1 });
  }

  /**
   * Obter banco de dados por ID
   */
  async getDatabase(id: string): Promise<IDatabase | null> {
    return Database.findById(id);
  }

  /**
   * Parar banco de dados
   */
  async stopDatabase(id: string): Promise<void> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');

    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    console.log(`⏸️  Parando banco ${db.name}...`);
    const result = await ssh.execCommand(`docker stop ${db.containerId}`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao parar container: ${result.stderr}`);
    }

    db.status = 'stopped';
    await db.save();
    
    console.log(`✅ Banco parado com sucesso`);
  }

  /**
   * Iniciar banco de dados
   */
  async startDatabase(id: string): Promise<void> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');

    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    console.log(`▶️  Iniciando banco ${db.name}...`);
    const result = await ssh.execCommand(`docker start ${db.containerId}`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao iniciar container: ${result.stderr}`);
    }

    db.status = 'running';
    await db.save();
    
    console.log(`✅ Banco iniciado com sucesso`);
  }

  /**
   * Reiniciar banco de dados
   */
  async restartDatabase(id: string): Promise<void> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');

    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    console.log(`🔄 Reiniciando banco ${db.name}...`);
    const result = await ssh.execCommand(`docker restart ${db.containerId}`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao reiniciar container: ${result.stderr}`);
    }

    db.status = 'running';
    await db.save();
    
    console.log(`✅ Banco reiniciado com sucesso`);
  }

  /**
   * Deletar banco de dados
   */
  async deleteDatabase(id: string): Promise<void> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');

    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    console.log(`🗑️  Deletando banco ${db.name}...`);

    // Parar container
    await ssh.execCommand(`docker stop ${db.containerId} || true`);
    
    // Remover container
    await ssh.execCommand(`docker rm ${db.containerId} || true`);
    
    // Remover volume (CUIDADO: dados serão perdidos!)
    await ssh.execCommand(`rm -rf ${db.volumePath}`);
    
    // Remover do banco
    await Database.findByIdAndDelete(id);
    
    console.log(`✅ Banco deletado com sucesso`);
  }

  /**
   * Obter logs do banco de dados
   */
  async getDatabaseLogs(id: string, lines: number = 100): Promise<string> {
    const db = await Database.findById(id);
    if (!db) throw new Error('Banco não encontrado');

    const server = await Server.findById(db.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`docker logs --tail ${lines} ${db.containerId}`);
    
    return result.stdout || result.stderr || 'Nenhum log disponível';
  }
}

export const databaseService = new DatabaseService();
