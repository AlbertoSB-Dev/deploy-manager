import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface GitCredentials {
  type: 'ssh' | 'token' | 'credential-manager' | 'none';
  sshKeyPath?: string;
  token?: string;
  username?: string;
}

export class GitCredentialService {
  /**
   * Detecta automaticamente as credenciais do Git disponíveis no sistema
   */
  static async detectCredentials(gitUrl: string): Promise<GitCredentials> {
    // 1. Verificar se é URL SSH (git@github.com:...)
    if (gitUrl.startsWith('git@')) {
      const sshKey = await this.findSSHKey();
      if (sshKey) {
        return {
          type: 'ssh',
          sshKeyPath: sshKey
        };
      }
    }

    // 2. Verificar Personal Access Token em variável de ambiente
    const envToken = this.getTokenFromEnv(gitUrl);
    if (envToken) {
      return {
        type: 'token',
        token: envToken
      };
    }

    // 3. Tentar usar Git Credential Manager (Windows/Linux/Mac)
    const credManager = await this.getCredentialsFromGitCredentialManager(gitUrl);
    if (credManager) {
      return credManager;
    }

    // 4. Verificar se há credenciais salvas no .git-credentials
    const gitCredentials = await this.getCredentialsFromFile(gitUrl);
    if (gitCredentials) {
      return gitCredentials;
    }

    return { type: 'none' };
  }

  /**
   * Encontra a chave SSH padrão do usuário
   */
  private static async findSSHKey(): Promise<string | null> {
    const homeDir = os.homedir();
    const sshDir = path.join(homeDir, '.ssh');
    
    // Ordem de preferência para chaves SSH
    const keyNames = ['id_ed25519', 'id_rsa', 'id_ecdsa', 'id_dsa'];
    
    for (const keyName of keyNames) {
      const keyPath = path.join(sshDir, keyName);
      try {
        await fs.access(keyPath);
        console.log(`✅ Chave SSH encontrada: ${keyPath}`);
        return keyPath;
      } catch {
        // Chave não existe, tentar próxima
      }
    }

    return null;
  }

  /**
   * Busca token em variáveis de ambiente
   */
  private static getTokenFromEnv(gitUrl: string): string | null {
    // GitHub
    if (gitUrl.includes('github.com')) {
      return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
    }
    
    // GitLab
    if (gitUrl.includes('gitlab.com')) {
      return process.env.GITLAB_TOKEN || process.env.GL_TOKEN || null;
    }
    
    // Bitbucket
    if (gitUrl.includes('bitbucket.org')) {
      return process.env.BITBUCKET_TOKEN || process.env.BB_TOKEN || null;
    }

    // Token genérico
    return process.env.GIT_TOKEN || null;
  }

  /**
   * Usa o Git Credential Manager para obter credenciais
   */
  private static async getCredentialsFromGitCredentialManager(gitUrl: string): Promise<GitCredentials | null> {
    try {
      const hostname = this.extractHostname(gitUrl);
      if (!hostname) return null;

      // Git credential manager não é facilmente acessível via exec
      // Esta funcionalidade requer spawn com stdin, desabilitando por enquanto
      console.log('Git Credential Manager: funcionalidade não implementada');
    } catch (error) {
      console.log('Git Credential Manager não retornou credenciais');
    }

    return null;
  }

  /**
   * Lê credenciais do arquivo ~/.git-credentials
   */
  private static async getCredentialsFromFile(gitUrl: string): Promise<GitCredentials | null> {
    try {
      const homeDir = os.homedir();
      const credFile = path.join(homeDir, '.git-credentials');
      
      const content = await fs.readFile(credFile, 'utf-8');
      const lines = content.split('\n');
      
      const hostname = this.extractHostname(gitUrl);
      if (!hostname) return null;

      for (const line of lines) {
        if (line.includes(hostname)) {
          // Formato: https://username:password@github.com
          const match = line.match(/https:\/\/([^:]+):([^@]+)@/);
          if (match) {
            return {
              type: 'token',
              username: match[1],
              token: match[2]
            };
          }
        }
      }
    } catch (error) {
      // Arquivo não existe ou não pode ser lido
    }

    return null;
  }

  /**
   * Extrai o hostname de uma URL Git
   */
  private static extractHostname(gitUrl: string): string | null {
    try {
      // SSH: git@github.com:user/repo.git
      if (gitUrl.startsWith('git@')) {
        const match = gitUrl.match(/git@([^:]+):/);
        return match ? match[1] : null;
      }
      
      // HTTPS: https://github.com/user/repo.git
      const url = new URL(gitUrl);
      return url.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Configura o Git para usar as credenciais detectadas
   */
  static async configureGitAuth(projectPath: string, credentials: GitCredentials): Promise<void> {
    if (credentials.type === 'ssh' && credentials.sshKeyPath) {
      // Configurar SSH
      await execAsync(
        `git config core.sshCommand "ssh -i ${credentials.sshKeyPath} -o StrictHostKeyChecking=no"`,
        { cwd: projectPath }
      );
      console.log('✅ Git configurado para usar SSH key');
    } else if (credentials.type === 'credential-manager') {
      // Git Credential Manager já está configurado globalmente
      console.log('✅ Usando Git Credential Manager');
    } else if (credentials.type === 'token' && credentials.token) {
      // Token será injetado na URL durante o clone
      console.log('✅ Usando Personal Access Token');
    }
  }

  /**
   * Testa se as credenciais funcionam
   */
  static async testCredentials(gitUrl: string, credentials: GitCredentials): Promise<boolean> {
    try {
      let testUrl = gitUrl;
      
      if (credentials.type === 'token' && credentials.token) {
        // Adicionar token à URL
        if (gitUrl.includes('github.com')) {
          testUrl = gitUrl.replace('https://', `https://${credentials.token}@`);
        } else if (gitUrl.includes('gitlab.com')) {
          testUrl = gitUrl.replace('https://', `https://oauth2:${credentials.token}@`);
        }
      }

      // Tentar fazer ls-remote (não clona, apenas verifica acesso)
      await execAsync(`git ls-remote ${testUrl}`, { timeout: 10000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}
