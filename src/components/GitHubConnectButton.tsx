'use client';

import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { GitHubAccountManager, GitHubAccount } from '@/lib/githubAccounts';

export function GitHubConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeAccount, setActiveAccount] = useState<GitHubAccount | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = () => {
    const account = GitHubAccountManager.getActiveAccount();
    setActiveAccount(account);
    setIsConnected(!!account);
  };

  const handleConnect = async () => {
    setConnecting(true);

    try {
      // Buscar URL de autorização do backend
      const response = await api.get('/auth/github/connect');
      const { authUrl } = response.data;

      console.log('🔗 Abrindo popup OAuth:', authUrl);

      // Abrir popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'GitHub OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        toast.error('Popup bloqueado! Permita popups para este site.');
        setConnecting(false);
        return;
      }

      // Escutar mensagem do popup
      const handleMessage = async (event: MessageEvent) => {
        // Verificar origem
        if (event.origin !== window.location.origin) {
          console.warn('⚠️ Mensagem de origem desconhecida:', event.origin);
          return;
        }

        if (event.data.type === 'github-oauth-code') {
          console.log('✅ Código OAuth recebido via postMessage');
          
          popup?.close();
          window.removeEventListener('message', handleMessage);

          try {
            // Enviar código para o backend
            const callbackResponse = await api.post('/auth/github/connect/callback', {
              code: event.data.code,
              state: event.data.state
            });

            const { githubToken } = callbackResponse.data.data;

            // Buscar dados do usuário do GitHub
            const userResponse = await fetch('https://api.github.com/user', {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            });

            const githubUser = await userResponse.json();

            // Salvar conta no gerenciador
            const account: GitHubAccount = {
              id: githubUser.login,
              username: githubUser.login,
              avatar: githubUser.avatar_url,
              token: githubToken,
              email: githubUser.email
            };

            GitHubAccountManager.saveAccount(account);
            loadAccount();

            toast.success('GitHub conectado com sucesso!');
          } catch (error: any) {
            console.error('❌ Erro ao processar callback:', error);
            toast.error(error.response?.data?.error || 'Erro ao conectar com GitHub');
          } finally {
            setConnecting(false);
          }
        } else if (event.data.type === 'github-oauth-error') {
          console.error('❌ Erro OAuth:', event.data.error);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          toast.error('Erro ao autorizar no GitHub');
          setConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout de 5 minutos
      setTimeout(() => {
        if (connecting) {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.error('Tempo esgotado. Tente novamente.');
          setConnecting(false);
        }
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('❌ Erro ao iniciar conexão:', error);
      toast.error('Erro ao conectar com GitHub');
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (activeAccount) {
      GitHubAccountManager.removeAccount(activeAccount.id);
      loadAccount();
      toast.success('GitHub desconectado');
    }
  };

  if (connecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        Conectando...
      </button>
    );
  }

  if (isConnected && activeAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
          <img 
            src={activeAccount.avatar} 
            alt={activeAccount.username}
            className="w-5 h-5 rounded-full"
          />
          <span>{activeAccount.username}</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition"
    >
      <Github className="w-4 h-4" />
      Conectar GitHub
    </button>
  );
}
