'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, Globe, Key, Server, CreditCard, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    githubClientSecret: false,
    assasApiKey: false,
    assasWebhookToken: false,
    panelGitToken: false,
  });
  const [settings, setSettings] = useState({
    serverIp: '',
    baseDomain: '',
    frontendUrl: '',
    githubClientId: '',
    githubClientSecret: '',
    githubCallbackUrl: '',
    assasApiKey: '',
    assasWebhookToken: '',
    assasEnvironment: 'sandbox' as 'sandbox' | 'production',
    panelGitRepo: '',
    panelGitBranch: '',
    panelGitToken: '',
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings({
        serverIp: response.data.serverIp || '',
        baseDomain: response.data.baseDomain || '',
        frontendUrl: response.data.frontendUrl || '',
        githubClientId: response.data.githubClientId || '',
        githubClientSecret: response.data.githubClientSecret || '',
        githubCallbackUrl: response.data.githubCallbackUrl || '',
        assasApiKey: response.data.assasApiKey || '',
        assasWebhookToken: response.data.assasWebhookToken || '',
        assasEnvironment: response.data.assasEnvironment || 'sandbox',
        panelGitRepo: response.data.panelGitRepo || 'AlbertoSB-Dev/deploy-manager',
        panelGitBranch: response.data.panelGitBranch || 'main',
        panelGitToken: response.data.panelGitToken || '',
      });
      setDataLoaded(true);
    } catch (error: any) {
      toast.error('Erro ao carregar configurações');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put('/admin/settings', settings);
      toast.success('Configurações salvas!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Configurações do Sistema
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure domínio, OAuth e integrações
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Domain Settings */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações de Domínio</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IP do Servidor</label>
              <input type="text" value={settings.serverIp} onChange={(e) => setSettings({ ...settings, serverIp: e.target.value })}
                placeholder="186.208.237.101" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domínio Base</label>
              <input type="text" value={settings.baseDomain} onChange={(e) => setSettings({ ...settings, baseDomain: e.target.value })}
                placeholder="sslip.io" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL do Frontend</label>
              <input type="text" value={settings.frontendUrl} onChange={(e) => setSettings({ ...settings, frontendUrl: e.target.value })}
                placeholder="http://186.208.237.101:8000" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* GitHub OAuth */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">GitHub OAuth</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client ID</label>
              <input type="text" value={settings.githubClientId} onChange={(e) => setSettings({ ...settings, githubClientId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client Secret</label>
              <div className="relative">
                <input type={showSecrets.githubClientSecret ? 'text' : 'password'} value={settings.githubClientSecret}
                  onChange={(e) => setSettings({ ...settings, githubClientSecret: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white" />
                <button type="button" onClick={() => toggleSecretVisibility('githubClientSecret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showSecrets.githubClientSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Callback URL</label>
              <input type="text" value={settings.githubCallbackUrl} onChange={(e) => setSettings({ ...settings, githubCallbackUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Assas Payment */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assas Payment Gateway</h2>
          </div>
          
          {/* Indicador de Ambiente Ativo */}
          <div className={`mb-4 p-3 rounded-xl border-2 ${
            settings.assasEnvironment === 'production' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                settings.assasEnvironment === 'production' ? 'bg-green-500' : 'bg-yellow-500'
              } animate-pulse`}></div>
              <span className={`font-semibold ${
                settings.assasEnvironment === 'production' 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                Ambiente Ativo: {settings.assasEnvironment === 'production' ? 'PRODUÇÃO' : 'SANDBOX (Teste)'}
              </span>
            </div>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
              {settings.assasEnvironment === 'production' 
                ? '⚠️ Cobranças reais serão processadas' 
                : '✓ Modo de teste - Nenhuma cobrança real será feita'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ambiente</label>
              <select 
                value={settings.assasEnvironment} 
                onChange={(e) => setSettings({ ...settings, assasEnvironment: e.target.value as 'sandbox' | 'production' })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="sandbox">Sandbox (Teste)</option>
                <option value="production">Produção</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use Sandbox para testes e Produção para cobranças reais
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
              <div className="relative">
                <input type={showSecrets.assasApiKey ? 'text' : 'password'} value={settings.assasApiKey}
                  onChange={(e) => setSettings({ ...settings, assasApiKey: e.target.value })}
                  placeholder={settings.assasEnvironment === 'production' ? 'Chave de Produção' : 'Chave de Sandbox'}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white" />
                <button type="button" onClick={() => toggleSecretVisibility('assasApiKey')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showSecrets.assasApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook Token</label>
              <div className="relative">
                <input type={showSecrets.assasWebhookToken ? 'text' : 'password'} value={settings.assasWebhookToken}
                  onChange={(e) => setSettings({ ...settings, assasWebhookToken: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white" />
                <button type="button" onClick={() => toggleSecretVisibility('assasWebhookToken')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showSecrets.assasWebhookToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Repository Settings */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Repositório do Painel</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Repositório Privado:</strong> Configure o token de acesso para permitir que o sistema detecte atualizações e faça deploy automático.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repositório (owner/repo)
              </label>
              <input 
                type="text" 
                value={settings.panelGitRepo} 
                onChange={(e) => setSettings({ ...settings, panelGitRepo: e.target.value })}
                placeholder="AlbertoSB-Dev/deploy-manager"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <input 
                type="text" 
                value={settings.panelGitBranch} 
                onChange={(e) => setSettings({ ...settings, panelGitBranch: e.target.value })}
                placeholder="main"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Access Token
              </label>
              <div className="relative">
                <input 
                  type={showSecrets.panelGitToken ? 'text' : 'password'} 
                  value={settings.panelGitToken}
                  onChange={(e) => setSettings({ ...settings, panelGitToken: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" 
                />
                <button 
                  type="button" 
                  onClick={() => toggleSecretVisibility('panelGitToken')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showSecrets.panelGitToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Crie um token em: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
                <br />
                Permissões necessárias: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">repo</code> (acesso completo ao repositório)
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium">
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
