import SFTPClient from 'ssh2-sftp-client';
import { Server } from '../models/Server';
import { sshService } from './SSHService';
import path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';
import mime from 'mime-types';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifyTime: Date;
  accessTime: Date;
  rights: {
    user: string;
    group: string;
    other: string;
  };
  owner: number;
  group: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

export interface DiskUsage {
  total: number;
  used: number;
  available: number;
  percentage: number;
}

class SFTPServiceClass {
  private async getClient(serverId: string): Promise<SFTPClient> {
    const server = await Server.findById(serverId);
    if (!server) {
      throw new Error('Servidor não encontrado');
    }

    console.log(`[SFTP] Conectando ao servidor ${server.host}:${server.port} como ${server.username}`);

    const sftp = new SFTPClient();
    
    try {
      // Tentar com diferentes algoritmos de autenticação
      await sftp.connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
        readyTimeout: 20000,
        algorithms: {
          kex: [
            'diffie-hellman-group1-sha1',
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384',
            'ecdh-sha2-nistp521',
            'diffie-hellman-group-exchange-sha256',
            'diffie-hellman-group14-sha1'
          ],
          cipher: [
            'aes128-ctr',
            'aes192-ctr',
            'aes256-ctr',
            'aes128-gcm',
            'aes128-gcm@openssh.com',
            'aes256-gcm',
            'aes256-gcm@openssh.com',
            'aes256-cbc'
          ],
          serverHostKey: [
            'ssh-rsa',
            'ecdsa-sha2-nistp256',
            'ecdsa-sha2-nistp384',
            'ecdsa-sha2-nistp521'
          ],
          hmac: [
            'hmac-sha2-256',
            'hmac-sha2-512',
            'hmac-sha1'
          ]
        }
      });

      console.log(`[SFTP] Conectado com sucesso ao servidor ${server.host}`);
      return sftp;
    } catch (error: any) {
      console.error(`[SFTP] Erro ao conectar: ${error.message}`);
      throw new Error(`Erro ao conectar ao servidor: ${error.message}`);
    }
  }

  /**
   * Listar arquivos e diretórios usando SSH (fallback quando SFTP não está disponível)
   */
  async listDirectory(serverId: string, dirPath: string = '/'): Promise<FileItem[]> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    console.log(`[SFTP] Listando diretório via SSH: ${dirPath}`);

    try {
      const ssh = await sshService.connect(server);
      
      // Usar comando ls com formato detalhado
      const result = await ssh.execCommand(`ls -la --time-style='+%Y-%m-%d %H:%M:%S' "${dirPath}" 2>/dev/null || ls -la "${dirPath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao listar diretório: ${result.stderr}`);
      }

      const lines = result.stdout.split('\n').filter(line => line.trim());
      const files: FileItem[] = [];

      for (const line of lines) {
        // Pular linhas de total e entradas . e ..
        if (line.startsWith('total') || line.match(/\s+\.\s*$/) || line.match(/\s+\.\.\s*$/)) {
          continue;
        }

        // Parse da linha do ls -la
        const match = line.match(/^([drwx-]+)\s+\d+\s+(\w+)\s+(\w+)\s+(\d+)\s+([\d-]+\s+[\d:]+)\s+(.+)$/);
        
        if (match) {
          const [, permissions, owner, group, size, datetime, name] = match;
          
          const isDirectory = permissions.startsWith('d');
          const isSymlink = permissions.startsWith('l');
          
          files.push({
            name: name.trim(),
            path: path.posix.join(dirPath, name.trim()),
            type: isDirectory ? 'directory' : isSymlink ? 'symlink' : 'file',
            size: parseInt(size),
            modifyTime: new Date(datetime),
            accessTime: new Date(datetime),
            rights: {
              user: permissions.substring(1, 4),
              group: permissions.substring(4, 7),
              other: permissions.substring(7, 10),
            },
            owner: 0,
            group: 0,
            isDirectory,
            isFile: !isDirectory && !isSymlink,
            isSymlink,
          });
        }
      }

      console.log(`[SFTP] ${files.length} arquivos encontrados via SSH`);
      return files;
    } catch (error: any) {
      console.error('Erro ao listar diretório via SSH:', error);
      throw new Error(`Erro ao listar diretório: ${error.message}`);
    }
  }

  /**
   * Obter informações de um arquivo
   */
  async getFileInfo(serverId: string, filePath: string): Promise<FileItem> {
    const sftp = await this.getClient(serverId);
    
    try {
      const stat = await sftp.stat(filePath);
      const dirname = path.posix.dirname(filePath);
      const basename = path.posix.basename(filePath);
      
      return {
        name: basename,
        path: filePath,
        type: stat.isDirectory ? 'directory' : stat.isFile ? 'file' : 'symlink',
        size: stat.size,
        modifyTime: new Date(stat.modifyTime),
        accessTime: new Date(stat.accessTime),
        rights: stat.rights,
        owner: stat.owner,
        group: stat.group,
        isDirectory: stat.isDirectory,
        isFile: stat.isFile,
        isSymlink: stat.isSymbolicLink,
      };
    } finally {
      await sftp.end();
    }
  }

  /**
   * Ler conteúdo de um arquivo usando SSH
   */
  async readFile(serverId: string, filePath: string): Promise<Buffer> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    try {
      const ssh = await sshService.connect(server);
      const result = await ssh.execCommand(`cat "${filePath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao ler arquivo: ${result.stderr}`);
      }
      
      return Buffer.from(result.stdout);
    } catch (error: any) {
      console.error('Erro ao ler arquivo:', error);
      throw new Error(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  /**
   * Escrever conteúdo em um arquivo usando SSH
   */
  async writeFile(serverId: string, filePath: string, content: Buffer | string): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    try {
      const ssh = await sshService.connect(server);
      
      // Escapar conteúdo para evitar problemas com caracteres especiais
      const contentStr = typeof content === 'string' ? content : content.toString();
      const base64Content = Buffer.from(contentStr).toString('base64');
      
      const result = await ssh.execCommand(`echo "${base64Content}" | base64 -d > "${filePath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao escrever arquivo: ${result.stderr}`);
      }
    } catch (error: any) {
      console.error('Erro ao escrever arquivo:', error);
      throw new Error(`Erro ao escrever arquivo: ${error.message}`);
    }
  }

  /**
   * Upload de arquivo usando SFTP
   */
  async uploadFile(serverId: string, localBuffer: Buffer, remotePath: string): Promise<void> {
    const sftp = await this.getClient(serverId);
    
    try {
      console.log(`[SFTP] Fazendo upload para: ${remotePath}`);
      await sftp.put(localBuffer, remotePath);
      console.log(`[SFTP] Upload concluído: ${remotePath}`);
    } catch (error: any) {
      console.error(`[SFTP] Erro no upload: ${error.message}`);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    } finally {
      await sftp.end();
    }
  }

  /**
   * Criar diretório usando SSH
   */
  async createDirectory(serverId: string, dirPath: string, recursive: boolean = true): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    try {
      const ssh = await sshService.connect(server);
      const flag = recursive ? '-p' : '';
      const result = await ssh.execCommand(`mkdir ${flag} "${dirPath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao criar diretório: ${result.stderr}`);
      }
    } catch (error: any) {
      throw new Error(`Erro ao criar diretório: ${error.message}`);
    }
  }

  /**
   * Excluir arquivo ou diretório usando SSH
   */
  async delete(serverId: string, targetPath: string, recursive: boolean = false): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    try {
      const ssh = await sshService.connect(server);
      const flag = recursive ? '-rf' : '-f';
      const result = await ssh.execCommand(`rm ${flag} "${targetPath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao excluir: ${result.stderr}`);
      }
    } catch (error: any) {
      throw new Error(`Erro ao excluir: ${error.message}`);
    }
  }

  /**
   * Renomear arquivo ou diretório usando SSH
   */
  async rename(serverId: string, oldPath: string, newPath: string): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    try {
      const ssh = await sshService.connect(server);
      const result = await ssh.execCommand(`mv "${oldPath}" "${newPath}"`);
      
      if (result.code !== 0) {
        throw new Error(`Erro ao renomear: ${result.stderr}`);
      }
    } catch (error: any) {
      throw new Error(`Erro ao renomear: ${error.message}`);
    }
  }

  /**
   * Mover arquivo ou diretório
   */
  async move(serverId: string, sourcePath: string, destPath: string): Promise<void> {
    return this.rename(serverId, sourcePath, destPath);
  }

  /**
   * Copiar arquivo
   */
  async copy(serverId: string, sourcePath: string, destPath: string): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`cp -r "${sourcePath}" "${destPath}"`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao copiar: ${result.stderr}`);
    }
  }

  /**
   * Download de arquivo usando SSH
   */
  async downloadFile(serverId: string, remotePath: string): Promise<Buffer> {
    return this.readFile(serverId, remotePath);
  }

  /**
   * Comprimir arquivos/diretórios
   */
  async compress(serverId: string, paths: string[], outputPath: string): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const pathsStr = paths.map(p => `"${p}"`).join(' ');
    const result = await ssh.execCommand(`tar -czf "${outputPath}" ${pathsStr}`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao comprimir: ${result.stderr}`);
    }
  }

  /**
   * Extrair arquivo comprimido
   */
  async extract(serverId: string, archivePath: string, destination: string): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    // Criar diretório de destino
    await ssh.execCommand(`mkdir -p "${destination}"`);
    
    // Detectar tipo de arquivo e extrair
    let command = '';
    if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
      command = `tar -xzf "${archivePath}" -C "${destination}"`;
    } else if (archivePath.endsWith('.tar')) {
      command = `tar -xf "${archivePath}" -C "${destination}"`;
    } else if (archivePath.endsWith('.zip')) {
      command = `unzip -o "${archivePath}" -d "${destination}"`;
    } else {
      throw new Error('Formato de arquivo não suportado');
    }
    
    const result = await ssh.execCommand(command);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao extrair: ${result.stderr}`);
    }
  }

  /**
   * Alterar permissões (chmod)
   */
  async chmod(serverId: string, targetPath: string, mode: string, recursive: boolean = false): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const recursiveFlag = recursive ? '-R' : '';
    const result = await ssh.execCommand(`chmod ${recursiveFlag} ${mode} "${targetPath}"`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao alterar permissões: ${result.stderr}`);
    }
  }

  /**
   * Alterar proprietário (chown)
   */
  async chown(serverId: string, targetPath: string, owner: string, group: string, recursive: boolean = false): Promise<void> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const recursiveFlag = recursive ? '-R' : '';
    const result = await ssh.execCommand(`chown ${recursiveFlag} ${owner}:${group} "${targetPath}"`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao alterar proprietário: ${result.stderr}`);
    }
  }

  /**
   * Obter tamanho de diretório
   */
  async getDirectorySize(serverId: string, dirPath: string): Promise<number> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`du -sb "${dirPath}" | cut -f1`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao obter tamanho: ${result.stderr}`);
    }
    
    return parseInt(result.stdout.trim());
  }

  /**
   * Obter uso de disco
   */
  async getDiskUsage(serverId: string, path: string = '/'): Promise<DiskUsage> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`df -B1 "${path}" | tail -1`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao obter uso de disco: ${result.stderr}`);
    }
    
    const parts = result.stdout.trim().split(/\s+/);
    const total = parseInt(parts[1]);
    const used = parseInt(parts[2]);
    const available = parseInt(parts[3]);
    const percentage = parseInt(parts[4].replace('%', ''));
    
    return { total, used, available, percentage };
  }

  /**
   * Buscar arquivos
   */
  async searchFiles(serverId: string, searchPath: string, query: string): Promise<FileItem[]> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`find "${searchPath}" -name "*${query}*" -type f -o -name "*${query}*" -type d | head -100`);
    
    if (result.code !== 0 && result.stderr) {
      throw new Error(`Erro ao buscar: ${result.stderr}`);
    }
    
    const paths = result.stdout.trim().split('\n').filter(p => p);
    
    const files: FileItem[] = [];
    for (const filePath of paths) {
      try {
        const info = await this.getFileInfo(serverId, filePath);
        files.push(info);
      } catch (error) {
        // Ignorar arquivos que não podem ser acessados
      }
    }
    
    return files;
  }

  /**
   * Ler últimas linhas de um arquivo (tail)
   */
  async tailFile(serverId: string, filePath: string, lines: number = 100): Promise<string> {
    const server = await Server.findById(serverId);
    if (!server) throw new Error('Servidor não encontrado');

    const ssh = await sshService.connect(server);
    
    const result = await ssh.execCommand(`tail -n ${lines} "${filePath}"`);
    
    if (result.code !== 0) {
      throw new Error(`Erro ao ler arquivo: ${result.stderr}`);
    }
    
    return result.stdout;
  }

  /**
   * Obter tipo MIME de um arquivo
   */
  getMimeType(filename: string): string {
    return mime.lookup(filename) || 'application/octet-stream';
  }

  /**
   * Validar caminho (segurança)
   */
  validatePath(targetPath: string): boolean {
    // Prevenir path traversal
    const normalized = path.posix.normalize(targetPath);
    
    // Caminhos restritos
    const restricted = [
      '/etc/passwd',
      '/etc/shadow',
      '/root/.ssh',
      '/home/*/.ssh',
    ];
    
    for (const pattern of restricted) {
      if (normalized.includes(pattern.replace('*', ''))) {
        return false;
      }
    }
    
    return true;
  }
}

export const SFTPService = new SFTPServiceClass();
