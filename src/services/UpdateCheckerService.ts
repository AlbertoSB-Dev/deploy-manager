import { GitService } from './GitService';
import Project from '../models/Project';
import axios from 'axios';

export class UpdateCheckerService {
  /**
   * Verifica se há atualizações disponíveis no GitHub para um projeto
   */
  async checkForUpdates(projectId: string): Promise<{ hasUpdate: boolean; latestCommit: string; currentCommit: string }> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Projeto não encontrado');

    // Pular projetos remotos - eles não têm repositório local
    if (project.serverId) {
      console.log(`⏭️  Pulando ${project.name} (projeto remoto)`);
      return {
        hasUpdate: false,
        latestCommit: project.latestGitCommit || 'unknown',
        currentCommit: project.currentVersion || 'unknown'
      };
    }

    try {
      const gitService = new GitService(project.workDir, project.gitAuth);
      
      // Fetch sem fazer pull
      await gitService.fetch();
      
      // Pega commit atual local
      const currentCommit = await gitService.getCurrentCommit();
      
      // Pega último commit remoto da branch
      const latestCommit = await gitService.getRemoteCommit(project.branch);
      
      const hasUpdate = currentCommit !== latestCommit;
      
      // Atualiza no banco
      project.latestGitCommit = latestCommit;
      project.hasUpdate = hasUpdate;
      await project.save();
      
      return {
        hasUpdate,
        latestCommit,
        currentCommit
      };
    } catch (error: any) {
      console.error(`Erro ao verificar atualizações para ${project.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Verifica atualizações para todos os projetos ativos
   */
  async checkAllProjects(): Promise<void> {
    const projects = await Project.find({ status: { $in: ['active', 'inactive'] } });
    
    console.log(`🔍 Verificando atualizações para ${projects.length} projetos...`);
    
    for (const project of projects) {
      try {
        const result = await this.checkForUpdates(project._id.toString());
        if (result.hasUpdate) {
          console.log(`✨ Atualização disponível para ${project.name}`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao verificar ${project.name}:`, error.message);
      }
    }
  }

  /**
   * Inicia verificação periódica de atualizações
   */
  startPeriodicCheck(intervalMinutes: number = 5): NodeJS.Timeout {
    console.log(`⏰ Iniciando verificação periódica de atualizações (a cada ${intervalMinutes} minutos)`);
    
    // Verifica imediatamente
    this.checkAllProjects();
    
    // Depois verifica periodicamente
    return setInterval(() => {
      this.checkAllProjects();
    }, intervalMinutes * 60 * 1000);
  }
}
