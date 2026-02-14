'use client';

import { useState, useEffect } from 'react';
import { Github, Check, X, List } from 'lucide-react';
import { GitHubAccountManager, GitHubAccount } from '@/lib/githubAccounts';

interface GitHubUser {
  login: string;
  name: string;
  avatar: string;
}

interface GitHubConnectProps {
  onConnected?: (token: string, user: GitHubUser) => void;
  onViewRepos?: () => void;
}

export default function GitHubConnect({ onConnected, onViewRepos }: GitHubConnectProps) {
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<GitHubAccount | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const loadedAccounts = GitHubAccountManager.getAccounts();
    const active = GitHubAccountManager.getActiveAccount();
    setAccounts(loadedAccounts);
    setActiveAccount(active);
    
    if (active && onConnected) {
      onConnected(active.token, {
        login: active.username,
        name: active.username,
        avatar: active.avatar
      });
    }
  };

  const handleConnect = async () => {
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
      
      // Usar rota pública do GitHub OAuth
      const response = await fetch(`${apiUrl}/github/auth/github`);
      const data = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.authUrl,
        'GitHub OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      window.addEventListener('message', async (event) => {
        if (event.data.type === 'github-oauth-code') {
          popup?.close();
          
          // Usar rota pública do callback (sem autenticação)
          const callbackResponse = await fetch(
            `${apiUrl}/github/auth/github/callback`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                code: event.data.code
              })
            }
          );

          const callbackData = await callbackResponse.json();

          if (callbackData.success) {
            // Salvar conta no gerenciador
            const account: GitHubAccount = {
              id: callbackData.user.login,
              username: callbackData.user.login,
              avatar: callbackData.user.avatar,
              token: callbackData.token,
              email: callbackData.user.email
            };
            
            GitHubAccountManager.saveAccount(account);
            loadAccounts();
            
            if (onConnected) {
              onConnected(callbackData.token, callbackData.user);
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao conectar com GitHub:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (account: GitHubAccount) => {
    GitHubAccountManager.setActiveAccount(account.id);
    setActiveAccount(account);
    
    if (onConnected) {
      onConnected(account.token, {
        login: account.username,
        name: account.username,
        avatar: account.avatar
      });
    }
  };

  const handleRemoveAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja remover esta conta?')) {
      GitHubAccountManager.removeAccount(id);
      loadAccounts();
    }
  };

  return (
    <div className="space-y-3">
      {/* Contas conectadas */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Contas conectadas ({accounts.length}):
          </p>
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                activeAccount?.id === account.id
                  ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={account.avatar}
                  alt={account.username}
                  className="w-10 h-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    {activeAccount?.id === account.id && (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                    <span className={`font-medium ${
                      activeAccount?.id === account.id 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {activeAccount?.id === account.id ? 'Conectado ao GitHub' : 'Usar esta conta'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{account.username}</p>
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveAccount(account.id, e)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Remover conta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Github className="w-5 h-5" />
          {loading ? 'Conectando...' : accounts.length > 0 ? '➕ Adicionar Outra Conta' : 'Conectar com GitHub'}
        </button>
        
        {/* Botão Ver Repositórios */}
        {activeAccount && onViewRepos && (
          <button
            onClick={onViewRepos}
            className="flex items-center justify-center gap-2 p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <List className="w-5 h-5" />
            <span>Ver Repositórios</span>
          </button>
        )}
      </div>
    </div>
  );
}
