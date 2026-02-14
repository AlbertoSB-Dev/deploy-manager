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
      
      const response = await fetch(`${apiUrl}/auth/github`);
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
          
          const callbackResponse = await fetch(
            `${apiUrl}/auth/github/callback`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code })
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
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                activeAccount?.id === account.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={account.avatar}
                  alt={account.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    {activeAccount?.id === account.id && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    <span className="font-medium text-green-900">
                      {activeAccount?.id === account.id ? 'Conectado ao GitHub' : account.username}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{account.username}</p>
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveAccount(account.id, e)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Remover conta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Github className="w-5 h-5" />
          {loading ? 'Conectando...' : accounts.length > 0 ? 'Adicionar Outra Conta' : 'Conectar com GitHub'}
        </button>
        
        {/* Botão Ver Repositórios */}
        {activeAccount && onViewRepos && (
          <button
            onClick={onViewRepos}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Ver Repositórios"
          >
            <List className="w-5 h-5" />
            <span>Ver Repositórios</span>
          </button>
        )}
      </div>
    </div>
  );
}
