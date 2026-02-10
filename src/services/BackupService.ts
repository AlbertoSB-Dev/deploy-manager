import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import Backup, { IBackup, BackupType, StorageType } from '../models/Backup';
import Database from '../models/Database';
import Project from '../models/Project';
import { WordPress } from '../models/WordPress';
import { Server } from '../models/Server';
import { sshService } from './SSHService';
import { Client as MinioClient } from 'minio';

const execAsync = promisify(exec);

interface BackupConfig {
  resourceId: string;
  type: BackupType;
  storageType: StorageType;
  userId: string;
  minioConfig?: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
}

interface RestoreConfig {
  backupId: string;
  userId: string;
  targetResourceId?: string; // Se quiser restaurar em outro recurso
}

export class BackupService {
  private backupDir = process.env.BACKUP_DIR || '/opt/deploy-manager/backups';

  /**
   * Criar backup de um recurso (banco, projeto, wordpress)
   */
  async createBackup(config: BackupConfig): Promise<IBackup> {
    const { resourceId, type, storageType, userId, minioConfig } = config;

    // Buscar informações do recurso
    let resource: any;
    let resourceName: string;
    let serverId: string | undefined;
    let serverName: string | undefined;

    switch (type) {
      case 'database':
        resource = await Database.findOne({ _id: resourceId, userId });
        if (!resource) throw new Error('Banco de dados não encontrado');
        resourceName = resource.displayName;
        serverId = resource.serverId;
        serverName = resource.serverName;
        break;
      case 'project':
        resource = await Project.findOne({ _id: resourceId, userId });
        if (!resource) throw new Error('Projeto não encontrado');
        resourceName = resource.displayName;
        serverId = resource.serverId;
        serverName = resource.serverName;
        break;
      case 'wordpress':
        resource = await WordPress.findOne({ _id: resourceId, userId });
        if (!resource) throw new Error('WordPress não encontrado');
        resourceName = resource.displayName;
        serverId = resource.serverId;
        serverName = resource.serverName;
        break;
      default:
        throw new Error('Tipo de backup inválido');
    }

    // Criar registro de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${type}-${resourceName}-${timestamp}`;
    
    const backup = new Backup({
      name: backupName,
      type,
      resourceId,
      resourceName,
      status: 'creating',
      storageType,
      serverId,
      serverName,
      metadata: {
        databaseType: resource.type,
        version: resource.version || resource.currentVersion,
        commit: resource.currentVersion,
        compressed: true,
        encryption: false
      },
      userId
    });

    await backup.save();

    try {
      // Executar backup baseado no tipo
      let backupPath: string;
      
      switch (type) {
        case 'database':
          backupPath = await this.backupDatabase(resource, backup._id.toString());
          break;
        case 'project':
          backupPath = await this.backupProject(resource, backup._id.toString());
          break;
        case 'wordpress':
          backupPath = await this.backupWordPress(resource, backup._id.toString());
          break;
        default:
          throw new Error('Tipo de backup não suportado');
      }

      // Obter tamanho do arquivo
      const stats = await fs.stat(backupPath);
      backup.size = stats.size;
      backup.localPath = backupPath;

      // Upload para MinIO/S3 se configurado
      if (storageType === 'minio' && minioConfig) {
        const remotePath = await this.uploadToMinio(backupPath, backupName, minioConfig);
        backup.remotePath = remotePath;
        backup.bucket = minioConfig.bucket;
      }

      backup.status = 'completed';
      backup.completedAt = new Date();
      await backup.save();

      console.log(`✅ Backup criado: ${backupName} (${this.formatBytes(stats.size)})`);
      return backup;

    } catch (error: any) {
      backup.status = 'failed';
      backup.error = error.message;
      await backup.save();
      throw error;
    }
  }

  /**
   * Backup de banco de dados
   */
  private async backupDatabase(database: any, backupId: string): Promise<string> {
    const backupFileName = `${backupId}.sql.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // Garantir que diretório existe
    await fs.mkdir(this.backupDir, { recursive: true });

    // Se for servidor remoto, fazer backup via SSH
    if (database.serverId) {
      return this.backupDatabaseRemote(database, backupPath);
    }

    // Backup local
    let command: string;

    switch (database.type) {
      case 'mongodb':
        command = `mongodump --uri="${database.connectionString}" --archive="${backupPath}" --gzip`;
        break;
      case 'mysql':
      case 'mariadb':
        command = `mysqldump -h ${database.host} -P ${database.port} -u ${database.username} -p${database.password} ${database.database} | gzip > ${backupPath}`;
        break;
      case 'postgresql':
        command = `PGPASSWORD="${database.password}" pg_dump -h ${database.host} -p ${database.port} -U ${database.username} ${database.database} | gzip > ${backupPath}`;
        break;
      case 'minio':
        // MinIO: fazer backup do volume de dados
        return this.backupMinIO(database, backupPath);
      default:
        throw new Error(`Tipo de banco não suportado para backup: ${database.type}`);
    }

    await execAsync(command);
    return backupPath;
  }

  /**
   * Backup de MinIO (volumes de dados S3)
   */
  private async backupMinIO(database: any, backupPath: string): Promise<string> {
    if (!database.containerId) {
      throw new Error('MinIO não tem container ativo');
    }

    // Fazer backup do volume /data do MinIO
    const command = `docker run --rm --volumes-from ${database.containerId} -v ${this.backupDir}:/backup alpine tar -czf /backup/$(basename ${backupPath}) /data`;
    
    await execAsync(command);
    return backupPath;
  }

  /**
   * Backup de banco de dados remoto
   */
  private async backupDatabaseRemote(database: any, localBackupPath: string): Promise<string> {
    const server = await Server.findById(database.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    const remoteBackupPath = `/tmp/backup-${Date.now()}.sql.gz`;

    let command: string;

    switch (database.type) {
      case 'mongodb':
        command = `docker exec ${database.containerId} mongodump --uri="mongodb://${database.username}:${database.password}@localhost:27017/${database.database}" --archive | gzip > ${remoteBackupPath}`;
        break;
      case 'mysql':
      case 'mariadb':
        command = `docker exec ${database.containerId} mysqldump -u ${database.username} -p${database.password} ${database.database} | gzip > ${remoteBackupPath}`;
        break;
      case 'postgresql':
        command = `docker exec ${database.containerId} pg_dump -U ${database.username} ${database.database} | gzip > ${remoteBackupPath}`;
        break;
      case 'minio':
        // MinIO: fazer backup do volume de dados
        command = `docker run --rm --volumes-from ${database.containerId} -v /tmp:/backup alpine tar -czf ${remoteBackupPath} /data`;
        break;
      default:
        throw new Error(`Tipo de banco não suportado: ${database.type}`);
    }

    // Executar backup no servidor remoto
    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao criar backup: ${result.stderr}`);
    }

    // Download do backup para local
    await ssh.getFile(localBackupPath, remoteBackupPath);

    // Remover arquivo temporário do servidor
    await ssh.execCommand(`rm -f ${remoteBackupPath}`);

    return localBackupPath;
  }

  /**
   * Backup de projeto (volumes Docker)
   */
  private async backupProject(project: any, backupId: string): Promise<string> {
    const backupFileName = `${backupId}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    await fs.mkdir(this.backupDir, { recursive: true });

    if (project.serverId) {
      return this.backupProjectRemote(project, backupPath);
    }

    // Backup local: fazer backup do volume do container
    if (!project.containerId) {
      throw new Error('Projeto não tem container ativo');
    }

    // Obter volumes do container
    const { stdout } = await execAsync(`docker inspect ${project.containerId} --format '{{range .Mounts}}{{.Source}}:{{.Destination}}\n{{end}}'`);
    const volumes = stdout.trim().split('\n').filter(Boolean);

    if (volumes.length === 0) {
      throw new Error('Container não tem volumes para backup');
    }

    // Fazer backup dos volumes
    const volumePaths = volumes.map(v => v.split(':')[0]).join(' ');
    await execAsync(`tar -czf ${backupPath} ${volumePaths}`);

    return backupPath;
  }

  /**
   * Backup de projeto remoto
   */
  private async backupProjectRemote(project: any, localBackupPath: string): Promise<string> {
    const server = await Server.findById(project.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    const remoteBackupPath = `/tmp/backup-${Date.now()}.tar.gz`;

    if (!project.containerId) {
      throw new Error('Projeto não tem container ativo');
    }

    // Fazer backup dos volumes do container remoto
    const command = `docker run --rm --volumes-from ${project.containerId} -v /tmp:/backup alpine tar -czf /backup/$(basename ${remoteBackupPath}) /`;
    
    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao criar backup: ${result.stderr}`);
    }

    // Download do backup
    await ssh.getFile(localBackupPath, remoteBackupPath);

    // Remover arquivo temporário
    await ssh.execCommand(`rm -f ${remoteBackupPath}`);

    return localBackupPath;
  }

  /**
   * Backup de WordPress (banco + arquivos)
   */
  private async backupWordPress(wordpress: any, backupId: string): Promise<string> {
    const backupFileName = `${backupId}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    await fs.mkdir(this.backupDir, { recursive: true });

    // WordPress = banco MySQL + arquivos wp-content
    // Fazer backup do container inteiro
    if (wordpress.serverId) {
      return this.backupProjectRemote(wordpress, backupPath);
    }

    if (!wordpress.containerId) {
      throw new Error('WordPress não tem container ativo');
    }

    // Backup local
    const command = `docker run --rm --volumes-from ${wordpress.containerId} -v ${this.backupDir}:/backup alpine tar -czf /backup/${backupFileName} /var/www/html`;
    await execAsync(command);

    return backupPath;
  }

  /**
   * Upload para MinIO
   */
  private async uploadToMinio(filePath: string, fileName: string, config: any): Promise<string> {
    const minioClient = new MinioClient({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: false,
      accessKey: config.accessKey,
      secretKey: config.secretKey
    });

    // Garantir que bucket existe
    const bucketExists = await minioClient.bucketExists(config.bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(config.bucket, 'us-east-1');
    }

    // Upload do arquivo
    const remotePath = `backups/${fileName}`;
    await minioClient.fPutObject(config.bucket, remotePath, filePath);

    return remotePath;
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(config: RestoreConfig): Promise<void> {
    const { backupId, userId, targetResourceId } = config;

    const backup = await Backup.findOne({ _id: backupId, userId });
    if (!backup) throw new Error('Backup não encontrado');

    if (backup.status !== 'completed') {
      throw new Error('Backup não está completo');
    }

    backup.status = 'restoring';
    await backup.save();

    try {
      const resourceId = targetResourceId || backup.resourceId;

      switch (backup.type) {
        case 'database':
          await this.restoreDatabase(backup, resourceId);
          break;
        case 'project':
          await this.restoreProject(backup, resourceId);
          break;
        case 'wordpress':
          await this.restoreWordPress(backup, resourceId);
          break;
        default:
          throw new Error('Tipo de backup não suportado');
      }

      backup.status = 'completed';
      await backup.save();

      console.log(`✅ Backup restaurado: ${backup.name}`);

    } catch (error: any) {
      backup.status = 'failed';
      backup.error = error.message;
      await backup.save();
      throw error;
    }
  }

  /**
   * Restaurar banco de dados
   */
  private async restoreDatabase(backup: IBackup, resourceId: string): Promise<void> {
    const database = await Database.findById(resourceId);
    if (!database) throw new Error('Banco de dados não encontrado');

    const backupPath = backup.localPath;
    if (!backupPath) throw new Error('Caminho do backup não encontrado');

    // Se for servidor remoto
    if (database.serverId) {
      return this.restoreDatabaseRemote(backup, database);
    }

    // Restore local
    let command: string;

    switch (database.type) {
      case 'mongodb':
        command = `mongorestore --uri="${database.connectionString}" --archive="${backupPath}" --gzip --drop`;
        break;
      case 'mysql':
      case 'mariadb':
        command = `gunzip < ${backupPath} | mysql -h ${database.host} -P ${database.port} -u ${database.username} -p${database.password} ${database.database}`;
        break;
      case 'postgresql':
        command = `gunzip < ${backupPath} | PGPASSWORD="${database.password}" psql -h ${database.host} -p ${database.port} -U ${database.username} ${database.database}`;
        break;
      default:
        throw new Error(`Tipo de banco não suportado: ${database.type}`);
    }

    await execAsync(command);
  }

  /**
   * Restaurar banco de dados remoto
   */
  private async restoreDatabaseRemote(backup: IBackup, database: any): Promise<void> {
    const server = await Server.findById(database.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    const remoteBackupPath = `/tmp/restore-${Date.now()}.sql.gz`;

    // Upload do backup para servidor
    if (!backup.localPath) throw new Error('Caminho do backup não encontrado');
    await ssh.putFile(backup.localPath, remoteBackupPath);

    let command: string;

    switch (database.type) {
      case 'mongodb':
        command = `gunzip < ${remoteBackupPath} | docker exec -i ${database.containerId} mongorestore --uri="mongodb://${database.username}:${database.password}@localhost:27017/${database.database}" --archive --drop`;
        break;
      case 'mysql':
      case 'mariadb':
        command = `gunzip < ${remoteBackupPath} | docker exec -i ${database.containerId} mysql -u ${database.username} -p${database.password} ${database.database}`;
        break;
      case 'postgresql':
        command = `gunzip < ${remoteBackupPath} | docker exec -i ${database.containerId} psql -U ${database.username} ${database.database}`;
        break;
      default:
        throw new Error(`Tipo de banco não suportado: ${database.type}`);
    }

    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao restaurar: ${result.stderr}`);
    }

    // Remover arquivo temporário
    await ssh.execCommand(`rm -f ${remoteBackupPath}`);
  }

  /**
   * Restaurar projeto
   */
  private async restoreProject(backup: IBackup, resourceId: string): Promise<void> {
    const project = await Project.findById(resourceId);
    if (!project) throw new Error('Projeto não encontrado');

    if (!backup.localPath) throw new Error('Caminho do backup não encontrado');

    if (project.serverId) {
      return this.restoreProjectRemote(backup, project);
    }

    // Restore local
    if (!project.containerId) {
      throw new Error('Projeto não tem container ativo');
    }

    // Extrair backup nos volumes do container
    await execAsync(`docker run --rm --volumes-from ${project.containerId} -v ${this.backupDir}:/backup alpine tar -xzf /backup/$(basename ${backup.localPath}) -C /`);
  }

  /**
   * Restaurar projeto remoto
   */
  private async restoreProjectRemote(backup: IBackup, project: any): Promise<void> {
    const server = await Server.findById(project.serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    const remoteBackupPath = `/tmp/restore-${Date.now()}.tar.gz`;

    // Upload do backup
    if (!backup.localPath) throw new Error('Caminho do backup não encontrado');
    await ssh.putFile(backup.localPath, remoteBackupPath);

    if (!project.containerId) {
      throw new Error('Projeto não tem container ativo');
    }

    // Restaurar volumes
    const command = `docker run --rm --volumes-from ${project.containerId} -v /tmp:/backup alpine tar -xzf /backup/$(basename ${remoteBackupPath}) -C /`;
    
    const result = await ssh.execCommand(command);
    if (result.code !== 0) {
      throw new Error(`Erro ao restaurar: ${result.stderr}`);
    }

    // Remover arquivo temporário
    await ssh.execCommand(`rm -f ${remoteBackupPath}`);
  }

  /**
   * Restaurar WordPress
   */
  private async restoreWordPress(backup: IBackup, resourceId: string): Promise<void> {
    // WordPress usa mesma lógica de projeto
    const wordpress = await WordPress.findById(resourceId);
    if (!wordpress) throw new Error('WordPress não encontrado');

    return this.restoreProject(backup, resourceId);
  }

  /**
   * Listar backups
   */
  async listBackups(userId: string, filters?: {
    type?: BackupType;
    resourceId?: string;
    status?: string;
  }): Promise<IBackup[]> {
    const query: any = { userId };

    if (filters?.type) query.type = filters.type;
    if (filters?.resourceId) query.resourceId = filters.resourceId;
    if (filters?.status) query.status = filters.status;

    return Backup.find(query).sort({ createdAt: -1 });
  }

  /**
   * Deletar backup
   */
  async deleteBackup(backupId: string, userId: string): Promise<void> {
    const backup = await Backup.findOne({ _id: backupId, userId });
    if (!backup) throw new Error('Backup não encontrado');

    // Remover arquivo local
    if (backup.localPath) {
      try {
        await fs.unlink(backup.localPath);
      } catch (error) {
        console.log('Arquivo local não encontrado');
      }
    }

    // TODO: Remover do MinIO/S3 se existir

    await Backup.findByIdAndDelete(backupId);
  }

  /**
   * Formatar bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const backupService = new BackupService();
