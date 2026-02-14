import { Server } from '../models/Server';
import { sshService } from './SSHService';

class ServerMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Inicia o monitoramento periódico de servidores
   * @param intervalMinutes Intervalo em minutos entre verificações (padrão: 5)
   */
  start(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('⚠️ Monitoramento de servidores já está rodando');
      return;
    }

    console.log(`🔍 Iniciando monitoramento de servidores (intervalo: ${intervalMinutes} minutos)`);
    this.isRunning = true;

    // Executar imediatamente
    this.checkAllServers();

    // Executar periodicamente
    this.intervalId = setInterval(() => {
      this.checkAllServers();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para o monitoramento periódico
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Monitoramento de servidores parado');
    }
  }

  /**
   * Verifica o status de todos os servidores
   */
  private async checkAllServers() {
    try {
      const servers = await Server.find({});
      
      if (servers.length === 0) {
        return;
      }

      console.log(`🔍 Verificando status de ${servers.length} servidor(es)...`);

      // Verificar servidores em paralelo (máximo 5 por vez para não sobrecarregar)
      const batchSize = 5;
      for (let i = 0; i < servers.length; i += batchSize) {
        const batch = servers.slice(i, i + batchSize);
        await Promise.all(
          batch.map(server => this.checkServerStatus(server))
        );
      }

      console.log('✅ Verificação de servidores concluída');
    } catch (error: any) {
      console.error('❌ Erro ao verificar servidores:', error.message);
    }
  }

  /**
   * Verifica o status de um servidor específico
   */
  private async checkServerStatus(server: any) {
    try {
      const isConnected = await sshService.testConnection(server);
      
      const newStatus = isConnected ? 'online' : 'offline';
      const oldStatus = server.status;

      // Atualizar apenas se o status mudou
      if (oldStatus !== newStatus) {
        await Server.findByIdAndUpdate(server._id, {
          status: newStatus,
          lastCheck: new Date()
        });
        
        console.log(`  ${server.name}: ${oldStatus} → ${newStatus}`);
      } else {
        // Atualizar apenas o lastCheck
        await Server.findByIdAndUpdate(server._id, {
          lastCheck: new Date()
        });
      }
    } catch (error: any) {
      console.error(`  ❌ Erro ao verificar ${server.name}:`, error.message);
      
      // Marcar como offline em caso de erro
      await Server.findByIdAndUpdate(server._id, {
        status: 'offline',
        lastCheck: new Date()
      });
    }
  }

  /**
   * Verifica o status de um servidor específico manualmente
   */
  async checkServer(serverId: string): Promise<boolean> {
    try {
      const server = await Server.findById(serverId);
      if (!server) {
        throw new Error('Servidor não encontrado');
      }

      const isConnected = await sshService.testConnection(server);
      
      await Server.findByIdAndUpdate(serverId, {
        status: isConnected ? 'online' : 'offline',
        lastCheck: new Date()
      });

      return isConnected;
    } catch (error: any) {
      console.error(`Erro ao verificar servidor ${serverId}:`, error.message);
      
      await Server.findByIdAndUpdate(serverId, {
        status: 'offline',
        lastCheck: new Date()
      });
      
      return false;
    }
  }
}

export const serverMonitorService = new ServerMonitorService();
