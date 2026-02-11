import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { io } from '../index';
import PanelVersion from '../models/PanelVersion';

const execAsync = promisify(exec);

export class PanelDeployService {
  private panelPath = '/opt/ark-deploy';

  private emitLog(message: string) {
    console.log(message);
    io.to('panel-deploy').emit('panel-deploy-log', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  async getVersions() {
    try {
      const versions = await PanelVersion.find().sort({ createdAt: -1 });
      return versions;
    } catch (error) {
      console.error('Erro ao buscar versões:', error);
      throw error;
    }
  }

  async getCurrentVersion() {
    try {
      // Ler a versão atual do arquivo ou container
      const { stdout } = await execAsync(`cd ${this.panelPath} && git describe --tags --always 2>/dev/null || echo "unknown"`);
      return stdout.trim();
    } catch (error) {
      console.error('Erro ao obter versão atual:', error);
      return 'unknown';
    }
  }

  async deployVersion(version: string, deployedBy: string = 'admin'): Promise<any> {
    const versionRecord = await PanelVersion.findOne({ version });
    
    if (!versionRecord) {
      throw new Error(`Versão ${version} não encontrada`);
    }

    if (versionRecord.status === 'failed') {
      throw new Error(`Versão ${version} falhou na build anterior`);
    }

    try {
      this.emitLog(`🚀 Iniciando deploy da versão ${version}...`);
      
      // 1. Parar containers atuais
      this.emitLog('⏹️ Parando containers atuais...');
      try {
        await execAsync(`cd ${this.panelPath} && docker-compose down`, { timeout: 30000 });
      } catch (error) {
        this.emitLog('⚠️ Erro ao parar containers (continuando...)');
      }

      // 2. Fazer checkout da versão
      this.emitLog(`📦 Fazendo checkout da versão ${version}...`);
      await execAsync(`cd ${this.panelPath} && git fetch origin && git checkout ${version}`, { timeout: 60000 });

      // 3. Limpar cache do frontend
      this.emitLog('🧹 Limpando cache do frontend...');
      try {
        await execAsync(`cd ${this.panelPath}/frontend && rm -rf .next`, { timeout: 30000 });
      } catch (error) {
        this.emitLog('⚠️ Erro ao limpar cache (continuando...)');
      }

      // 4. Fazer build do frontend
      this.emitLog('🔨 Fazendo build do frontend...');
      await execAsync(`cd ${this.panelPath} && docker-compose build --no-cache frontend`, { timeout: 600000 }); // 10 minutos

      // 5. Fazer build do backend (se necessário)
      this.emitLog('🔨 Fazendo build do backend...');
      try {
        await execAsync(`cd ${this.panelPath} && docker-compose build --no-cache backend`, { timeout: 600000 });
      } catch (error) {
        this.emitLog('⚠️ Erro ao fazer build do backend (continuando...)');
      }

      // 6. Iniciar containers
      this.emitLog('🚀 Iniciando containers...');
      await execAsync(`cd ${this.panelPath} && docker-compose up -d`, { timeout: 60000 });

      // 7. Aguardar containers ficarem saudáveis
      this.emitLog('⏳ Aguardando containers ficarem saudáveis...');
      await this.waitForContainersHealth(120000); // 2 minutos

      // 8. Atualizar registro de versão
      versionRecord.status = 'ready';
      versionRecord.createdBy = deployedBy;
      await versionRecord.save();

      this.emitLog(`✅ Deploy da versão ${version} concluído com sucesso!`);
      
      return {
        success: true,
        version,
        message: `Deploy da versão ${version} concluído com sucesso`,
        deployedAt: new Date()
      };
    } catch (error: any) {
      this.emitLog(`❌ Erro no deploy: ${error.message}`);
      
      // Tentar reverter para versão anterior
      this.emitLog('🔄 Tentando reverter para versão anterior...');
      try {
        await execAsync(`cd ${this.panelPath} && git checkout -`, { timeout: 30000 });
        await execAsync(`cd ${this.panelPath} && docker-compose down && docker-compose up -d`, { timeout: 60000 });
        this.emitLog('✅ Revertido para versão anterior');
      } catch (revertError) {
        this.emitLog(`❌ Erro ao reverter: ${revertError}`);
      }

      throw error;
    }
  }

  async rollback(previousVersion?: string): Promise<any> {
    try {
      this.emitLog('🔄 Iniciando rollback...');

      let targetVersion = previousVersion;

      if (!targetVersion) {
        // Obter versão anterior
        this.emitLog('📋 Buscando versão anterior...');
        const versions = await PanelVersion.find({ status: 'ready' }).sort({ createdAt: -1 }).limit(2);
        
        if (versions.length < 2) {
          throw new Error('Não há versão anterior disponível para rollback');
        }

        targetVersion = versions[1].version;
      }

      this.emitLog(`🔄 Revertendo para versão ${targetVersion}...`);
      
      // 1. Parar containers
      this.emitLog('⏹️ Parando containers...');
      try {
        await execAsync(`cd ${this.panelPath} && docker-compose down`, { timeout: 30000 });
      } catch (error) {
        this.emitLog('⚠️ Erro ao parar containers (continuando...)');
      }

      // 2. Fazer checkout da versão anterior
      this.emitLog(`📦 Fazendo checkout da versão ${targetVersion}...`);
      await execAsync(`cd ${this.panelPath} && git fetch origin && git checkout ${targetVersion}`, { timeout: 60000 });

      // 3. Limpar cache
      this.emitLog('🧹 Limpando cache...');
      try {
        await execAsync(`cd ${this.panelPath}/frontend && rm -rf .next`, { timeout: 30000 });
      } catch (error) {
        this.emitLog('⚠️ Erro ao limpar cache (continuando...)');
      }

      // 4. Fazer build
      this.emitLog('🔨 Fazendo build...');
      await execAsync(`cd ${this.panelPath} && docker-compose build --no-cache frontend`, { timeout: 600000 });

      // 5. Iniciar containers
      this.emitLog('🚀 Iniciando containers...');
      await execAsync(`cd ${this.panelPath} && docker-compose up -d`, { timeout: 60000 });

      // 6. Aguardar containers ficarem saudáveis
      this.emitLog('⏳ Aguardando containers ficarem saudáveis...');
      await this.waitForContainersHealth(120000);

      this.emitLog(`✅ Rollback para versão ${targetVersion} concluído com sucesso!`);

      return {
        success: true,
        version: targetVersion,
        message: `Rollback para versão ${targetVersion} concluído com sucesso`,
        rolledBackAt: new Date()
      };
    } catch (error: any) {
      this.emitLog(`❌ Erro no rollback: ${error.message}`);
      throw error;
    }
  }

  async createVersion(version: string, message: string = '', createdBy: string = 'system'): Promise<any> {
    try {
      // Verificar se versão já existe
      const existing = await PanelVersion.findOne({ version });
      if (existing) {
        throw new Error(`Versão ${version} já existe`);
      }

      // Obter informações do commit
      let commit = '';
      try {
        const { stdout } = await execAsync(`cd ${this.panelPath} && git rev-parse HEAD`);
        commit = stdout.trim();
      } catch (error) {
        this.emitLog('⚠️ Erro ao obter commit');
      }

      // Criar registro de versão
      const panelVersion = new PanelVersion({
        version,
        commit,
        message,
        createdBy,
        status: 'ready',
        date: new Date()
      });

      await panelVersion.save();

      this.emitLog(`✅ Versão ${version} criada com sucesso`);

      return panelVersion;
    } catch (error: any) {
      this.emitLog(`❌ Erro ao criar versão: ${error.message}`);
      throw error;
    }
  }

  async deleteVersion(version: string): Promise<any> {
    try {
      const current = await this.getCurrentVersion();
      
      if (current === version) {
        throw new Error('Não é possível deletar a versão atual');
      }

      const result = await PanelVersion.deleteOne({ version });

      if (result.deletedCount === 0) {
        throw new Error(`Versão ${version} não encontrada`);
      }

      this.emitLog(`✅ Versão ${version} deletada com sucesso`);

      return {
        success: true,
        message: `Versão ${version} deletada com sucesso`
      };
    } catch (error: any) {
      this.emitLog(`❌ Erro ao deletar versão: ${error.message}`);
      throw error;
    }
  }

  private async waitForContainersHealth(maxWait: number = 120000): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 5000; // 5 segundos

    while (Date.now() - startTime < maxWait) {
      try {
        const { stdout } = await execAsync(`cd ${this.panelPath} && docker-compose ps --services --filter "status=running"`);
        const runningServices = stdout.trim().split('\n').filter(s => s);
        
        // Verificar se frontend e backend estão rodando
        if (runningServices.includes('frontend') && runningServices.includes('backend')) {
          this.emitLog('✅ Containers estão saudáveis');
          return;
        }

        this.emitLog(`⏳ Aguardando containers... (${runningServices.join(', ')})`);
      } catch (error) {
        this.emitLog('⚠️ Erro ao verificar status dos containers');
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error('Timeout aguardando containers ficarem saudáveis');
  }
}

export const panelDeployService = new PanelDeployService();
