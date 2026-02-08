import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { IGitAuth } from '../models/Project';
import { GitCredentialService } from './GitCredentialService';

export class GitService {
  private git?: SimpleGit;
  private gitAuth?: IGitAuth;

  constructor(private projectPath: string, gitAuth?: IGitAuth) {
    this.gitAuth = gitAuth;
  }

  private async initGit(): Promise<SimpleGit> {
    if (this.git) return this.git;

    // Verificar se o diretório do projeto existe e é um repositório git
    try {
      await fs.access(path.join(this.projectPath, '.git'));
    } catch {
      // Se não for um repositório git, criar o diretório pai
      const parentDir = path.dirname(this.projectPath);
      await fs.mkdir(parentDir, { recursive: true });
    }
    
    const options: Partial<SimpleGitOptions> = {
      baseDir: this.projectPath,
      binary: 'git',
      maxConcurrentProcesses: 6,
    };

    // Configure SSH if needed
    if (this.gitAuth?.type === 'ssh' && this.gitAuth.sshKeyPath) {
      options.config = [
        `core.sshCommand=ssh -i ${this.gitAuth.sshKeyPath} -o StrictHostKeyChecking=no`
      ];
    }

    this.git = simpleGit(options);
    return this.git;
  }

  async clone(gitUrl: string, branch: string = 'main'): Promise<void> {
    // Verificar se o diretório já existe
    try {
      await fs.access(this.projectPath);
      // Se existir, remover para fazer clone limpo
      console.log('🗑️  Removendo diretório existente...');
      await fs.rm(this.projectPath, { recursive: true, force: true });
    } catch {
      // Diretório não existe, tudo bem
    }

    // Criar diretório do projeto
    await fs.mkdir(this.projectPath, { recursive: true });
    
    let cloneUrl = gitUrl;
    let useAutoCredentials = false;

    // Se não há autenticação manual, tentar detectar automaticamente
    if (!this.gitAuth || !this.gitAuth.type) {
      console.log('🔍 Detectando credenciais Git automaticamente...');
      const autoCredentials = await GitCredentialService.detectCredentials(gitUrl);
      
      if (autoCredentials.type !== 'none') {
        console.log(`✅ Credenciais detectadas: ${autoCredentials.type}`);
        
        // Converter para IGitAuth
        if (autoCredentials.type === 'ssh' && autoCredentials.sshKeyPath) {
          this.gitAuth = {
            type: 'ssh',
            sshKeyPath: autoCredentials.sshKeyPath
          };
        } else if (autoCredentials.type === 'token' && autoCredentials.token) {
          this.gitAuth = {
            type: 'token',
            token: autoCredentials.token
          };
        } else if (autoCredentials.type === 'credential-manager') {
          // Git Credential Manager será usado automaticamente pelo Git
          useAutoCredentials = true;
        }
      } else {
        console.log('⚠️  Nenhuma credencial detectada, tentando clone público...');
      }
    }
    
    // Add authentication to URL if using token or basic auth
    if (this.gitAuth?.type === 'token' && this.gitAuth.token) {
      cloneUrl = this.addTokenToUrl(gitUrl, this.gitAuth.token);
    } else if (this.gitAuth?.type === 'basic' && this.gitAuth.username && this.gitAuth.password) {
      cloneUrl = this.addBasicAuthToUrl(gitUrl, this.gitAuth.username, this.gitAuth.password);
    }

    const options: string[] = ['--branch', branch];
    
    // Add SSH config if needed
    if (this.gitAuth?.type === 'ssh' && this.gitAuth.sshKeyPath) {
      options.push('-c', `core.sshCommand=ssh -i ${this.gitAuth.sshKeyPath} -o StrictHostKeyChecking=no`);
    }

    try {
      await simpleGit().clone(cloneUrl, this.projectPath, options);
      console.log('✅ Clone concluído com sucesso');
    } catch (error: any) {
      // Limpar diretório em caso de erro
      await fs.rm(this.projectPath, { recursive: true, force: true });
      
      // Se a branch não existir, tentar clonar sem especificar branch
      if (error.message.includes('not found in upstream')) {
        console.log(`⚠️  Branch '${branch}' não encontrada, clonando branch padrão...`);
        await fs.mkdir(this.projectPath, { recursive: true });
        const optionsWithoutBranch = options.filter(opt => opt !== '--branch' && opt !== branch);
        await simpleGit().clone(cloneUrl, this.projectPath, optionsWithoutBranch);
        console.log('✅ Clone concluído com branch padrão');
      } else {
        throw error;
      }
    }
    
    // Configurar credenciais no repositório clonado
    if (this.gitAuth?.type === 'ssh' && this.gitAuth.sshKeyPath) {
      await GitCredentialService.configureGitAuth(this.projectPath, {
        type: 'ssh',
        sshKeyPath: this.gitAuth.sshKeyPath
      });
    }
  }

  private addTokenToUrl(gitUrl: string, token: string): string {
    // GitHub: https://github.com/user/repo.git -> https://token@github.com/user/repo.git
    // GitLab: https://gitlab.com/user/repo.git -> https://oauth2:token@gitlab.com/user/repo.git
    
    if (gitUrl.includes('github.com')) {
      return gitUrl.replace('https://', `https://${token}@`);
    } else if (gitUrl.includes('gitlab.com')) {
      return gitUrl.replace('https://', `https://oauth2:${token}@`);
    }
    
    // Generic
    return gitUrl.replace('https://', `https://${token}@`);
  }

  private addBasicAuthToUrl(gitUrl: string, username: string, password: string): string {
    return gitUrl.replace('https://', `https://${username}:${password}@`);
  }

  async pull(): Promise<string> {
    const git = await this.initGit();
    const result = await git.pull();
    return result.summary.changes.toString();
  }

  async checkout(branchOrTag: string): Promise<void> {
    const git = await this.initGit();
    try {
      await git.checkout(branchOrTag);
    } catch (error: any) {
      // Se o branch não existir, tentar branches comuns
      console.log(`⚠️  Branch '${branchOrTag}' não encontrado, tentando alternativas...`);
      
      const branches = await git.branch();
      const remoteBranches = branches.all.filter(b => b.startsWith('remotes/origin/'));
      
      // Tentar master se main não existir, ou vice-versa
      if (branchOrTag === 'main' && remoteBranches.includes('remotes/origin/master')) {
        console.log('✅ Usando branch master');
        await git.checkout('master');
      } else if (branchOrTag === 'master' && remoteBranches.includes('remotes/origin/main')) {
        console.log('✅ Usando branch main');
        await git.checkout('main');
      } else {
        // Usar o primeiro branch disponível
        const firstBranch = remoteBranches[0]?.replace('remotes/origin/', '');
        if (firstBranch) {
          console.log(`✅ Usando branch ${firstBranch}`);
          await git.checkout(firstBranch);
        } else {
          throw error;
        }
      }
    }
  }

  async getCurrentCommit(): Promise<string> {
    const git = await this.initGit();
    const log = await git.log(['-1']);
    return log.latest?.hash || 'unknown';
  }

  async getCurrentBranch(): Promise<string> {
    const git = await this.initGit();
    const branch = await git.branch();
    return branch.current;
  }

  async getTags(): Promise<string[]> {
    const git = await this.initGit();
    const tags = await git.tags();
    return tags.all;
  }

  async getBranches(): Promise<string[]> {
    const git = await this.initGit();
    const branches = await git.branch();
    return branches.all;
  }

  async getCommitInfo(commit: string): Promise<any> {
    const git = await this.initGit();
    const log = await git.log(['-1', commit]);
    return log.latest;
  }

  async reset(commit: string): Promise<void> {
    const git = await this.initGit();
    await git.reset(['--hard', commit]);
  }

  async fetch(): Promise<void> {
    const git = await this.initGit();
    await git.fetch();
  }

  async getRemoteCommit(branch: string): Promise<string> {
    const git = await this.initGit();
    const result = await git.raw(['rev-parse', `origin/${branch}`]);
    return result.trim();
  }
}
