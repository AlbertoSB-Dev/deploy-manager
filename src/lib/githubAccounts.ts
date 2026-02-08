// Gerenciador de múltiplas contas GitHub

export interface GitHubAccount {
  id: string;
  username: string;
  avatar: string;
  token: string;
  email?: string;
}

const STORAGE_KEY = 'github_accounts';
const ACTIVE_ACCOUNT_KEY = 'active_github_account';

export class GitHubAccountManager {
  // Salvar conta
  static saveAccount(account: GitHubAccount): void {
    const accounts = this.getAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    this.setActiveAccount(account.id);
  }

  // Obter todas as contas
  static getAccounts(): GitHubAccount[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Obter conta ativa
  static getActiveAccount(): GitHubAccount | null {
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (!activeId) return null;
    
    const accounts = this.getAccounts();
    return accounts.find(a => a.id === activeId) || null;
  }

  // Definir conta ativa
  static setActiveAccount(id: string): void {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
  }

  // Remover conta
  static removeAccount(id: string): void {
    const accounts = this.getAccounts().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    
    // Se era a conta ativa, limpar
    if (this.getActiveAccount()?.id === id) {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    }
  }

  // Limpar todas as contas
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  }

  // Verificar se tem conta conectada
  static hasAccounts(): boolean {
    return this.getAccounts().length > 0;
  }
}
