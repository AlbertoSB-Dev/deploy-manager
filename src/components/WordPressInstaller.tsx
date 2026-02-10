'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface WordPressInstallerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WordPressInstaller({ onClose, onSuccess }: WordPressInstallerProps) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServers, setLoadingServers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    serverId: '',
    name: '',
    domain: '',
    wpAdminUser: 'admin',
    wpAdminPassword: '',
    wpAdminEmail: '',
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoadingServers(true);
      const response = await api.get('/servers');
      setServers(response.data);
      
      // Auto-selecionar primeiro servidor
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, serverId: response.data[0]._id }));
      }
    } catch (error: any) {
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoadingServers(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, wpAdminPassword: password }));
    toast.success('Senha gerada!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serverId || !formData.name || !formData.wpAdminEmail) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.wpAdminEmail)) {
      toast.error('Email inválido');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/wordpress/install', formData);
      
      toast.success(
        <div>
          <p className="font-bold">WordPress instalando!</p>
          <p className="text-sm mt-1">Aguarde 2-3 minutos para conclusão</p>
          <p className="text-sm mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            Usuário: {response.data.wordpress.adminUser}<br/>
            Senha: {response.data.wordpress.adminPassword}
          </p>
          <p className="text-xs mt-2 text-orange-600">⚠️ Salve estas credenciais!</p>
        </div>,
        { duration: 15000 }
      );
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao instalar WordPress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C5.1 3.257 8.354 1.469 12 1.469c2.763 0 5.285 1.064 7.18 2.805-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.211 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instalar WordPress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure seu novo site WordPress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome do Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Site *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Meu Blog"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Servidor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servidor *
            </label>
            {loadingServers ? (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Carregando servidores...</span>
              </div>
            ) : servers.length === 0 ? (
              <div className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Nenhum servidor disponível. Adicione um servidor primeiro.
              </div>
            ) : (
              <select
                value={formData.serverId}
                onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {servers.map((server) => (
                  <option key={server._id} value={server._id}>
                    {server.name} ({server.host})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Domínio (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Domínio (opcional)
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="Deixe vazio para gerar automaticamente"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se vazio, será gerado: nomedosite.IP.sslip.io
            </p>
          </div>

          {/* Credenciais Admin */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Credenciais do Administrador WordPress
            </h3>

            {/* Usuário Admin */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuário Admin
              </label>
              <input
                type="text"
                value={formData.wpAdminUser}
                onChange={(e) => setFormData({ ...formData, wpAdminUser: e.target.value })}
                placeholder="admin"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Senha Admin */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha Admin
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.wpAdminPassword}
                    onChange={(e) => setFormData({ ...formData, wpAdminPassword: e.target.value })}
                    placeholder="Deixe vazio para gerar automaticamente"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gerar
                </button>
              </div>
            </div>

            {/* Email Admin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Admin *
              </label>
              <input
                type="email"
                value={formData.wpAdminEmail}
                onChange={(e) => setFormData({ ...formData, wpAdminEmail: e.target.value })}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              ⚠️ <strong>Importante:</strong> A instalação pode levar 2-3 minutos. 
              As credenciais serão mostradas apenas uma vez após a instalação.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || servers.length === 0}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Instalando...
                </>
              ) : (
                'Instalar WordPress'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
