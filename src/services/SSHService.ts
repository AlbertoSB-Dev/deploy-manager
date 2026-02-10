import { NodeSSH } from 'node-ssh';
import { IServer } from '../models/Server';

class SSHService {
  private connections: Map<string, NodeSSH> = new Map();

  async connect(server: IServer): Promise<NodeSSH> {
    // Verificar se já existe conexão ativa
    const existingConnection = this.connections.get(server._id.toString());
    if (existingConnection && existingConnection.isConnected()) {
      return existingConnection;
    }

    const ssh = new NodeSSH();
    
    try {
      const config: any = {
        host: server.host,
        port: server.port,
        username: server.username,
        tryKeyboard: true,
        readyTimeout: 30000,
        keepaliveInterval: 10000
      };

      // Usar métodos de descriptografia para obter credenciais
      if (server.authType === 'password') {
        config.password = server.getPassword();
      } else if (server.authType === 'key') {
        config.privateKey = server.getPrivateKey();
      }

      await ssh.connect(config);
      this.connections.set(server._id.toString(), ssh);
      
      console.log(`✅ Conectado ao servidor ${server.name} (${server.host})`);
      return ssh;
    } catch (error: any) {
      console.error(`❌ Erro ao conectar ao servidor ${server.name}:`, error.message);
      throw new Error(`Falha na conexão SSH: ${error.message}`);
    }
  }

  async executeCommand(
    serverId: string, 
    command: string,
    options?: {
      onStdout?: (chunk: Buffer) => void;
      onStderr?: (chunk: Buffer) => void;
    }
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    const ssh = this.connections.get(serverId);
    if (!ssh || !ssh.isConnected()) {
      throw new Error('Servidor não conectado. Execute connect() primeiro.');
    }

    try {
      const result = await ssh.execCommand(command, {
        onStdout: options?.onStdout,
        onStderr: options?.onStderr
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code || 0
      };
    } catch (error: any) {
      throw new Error(`Erro ao executar comando: ${error.message}`);
    }
  }

  async testConnection(server: IServer): Promise<boolean> {
    try {
      const ssh = await this.connect(server);
      const result = await ssh.execCommand('echo "test"');
      return result.code === 0;
    } catch (error) {
      return false;
    }
  }

  async disconnect(serverId: string): Promise<void> {
    const ssh = this.connections.get(serverId);
    if (ssh) {
      ssh.dispose();
      this.connections.delete(serverId);
      console.log(`🔌 Desconectado do servidor ${serverId}`);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [serverId, ssh] of this.connections.entries()) {
      ssh.dispose();
      console.log(`🔌 Desconectado do servidor ${serverId}`);
    }
    this.connections.clear();
  }

  isConnected(serverId: string): boolean {
    const ssh = this.connections.get(serverId);
    return ssh ? ssh.isConnected() : false;
  }
}

export const sshService = new SSHService();
