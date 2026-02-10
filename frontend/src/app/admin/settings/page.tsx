'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Globe, Key, Server, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    serverIp: '',
    baseDomain: '',
    frontendUrl: '',
    githubClientId: '',
    githubClientSecret: '',
    githubCallbackUrl: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put('/admin/settings', settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!confirm('Deseja reiniciar o servidor? Isso pode levar alguns segundos.')) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/restart');
      toast.success('Servidor reiniciando...');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (error: any) {
      toast.error('Erro ao reiniciar servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configurações do Sistema
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure o domínio, OAuth e outras opções do painel
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configurações de Domínio */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Configurações de Domínio
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IP do Servidor
                  </label>
                  <input
                    type="text"
                    value={settings.serverIp}
                    onChange={(e) => setSettings({ ...settings, serverIp: e.target.value })}
                    placeholder="186.208.237.101"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    IP público do servidor onde o painel está instalado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domínio Base
                  </label>
                  <input
                    type="text"
                    value={settings.baseDomain}
                    onChange={(e) => setSettings({ ...settings, baseDomain: e.target.value })}
                    placeholder="sslip.io"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Domínio base para projetos (ex: sslip.io, seu-dominio.com)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL do Frontend
                  </label>
                  <input
                    type="text"
                    value={settings.frontendUrl}
                    onChange={(e) => setSettings({ ...settings, frontendUrl: e.target.value })}
                    placeholder="http://186.208.237.101:8000"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    URL completa onde o frontend está acessível
                  </p>
                </div>
              </div>
            </div>

            {/* Configurações GitHub OAuth */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  GitHub OAuth
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={settings.githubClientId}
                    onChange={(e) => setSettings({ ...settings, githubClientId: e.target.value })}
                    placeholder="Ov23liW1o7g1Xijfo95U"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={settings.githubClientSecret}
                    onChange={(e) => setSettings({ ...settings, githubClientSecret: e.target.value })}
                    placeholder="••••••••••••••••••••"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Callback URL
                  </label>
                  <input
                    type="text"
                    value={settings.githubCallbackUrl}
                    onChange={(e) => setSettings({ ...settings, githubCallbackUrl: e.target.value })}
                    placeholder="http://186.208.237.101:8000/auth/github/callback"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    <strong>ℹ️ Como configurar:</strong>
                    <br />
                    1. Acesse: <a href="https://github.com/settings/developers" target="_blank" className="underline">github.com/settings/developers</a>
                    <br />
                    2. Crie um novo OAuth App
                    <br />
                    3. Use a Callback URL acima
                    <br />
                    4. Cole o Client ID e Secret aqui
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>

              <button
                onClick={handleRestart}
                disabled={loading}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reiniciar Servidor
              </button>
            </div>
          </div>

          {/* Sidebar com Informações */}
          <div className="space-y-6">
            {/* Status do Sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Status do Sistema
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Backend</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MongoDB</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Traefik</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                    Rodando
                  </span>
                </div>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
                💡 Dicas
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>• Após alterar configurações, reinicie o servidor</li>
                <li>• Use sslip.io para domínios automáticos</li>
                <li>• Configure GitHub OAuth para deploy de repos privados</li>
                <li>• Mantenha o IP do servidor atualizado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
