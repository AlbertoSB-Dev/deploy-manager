'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ExternalLink,
  Play,
  Square,
  RefreshCw,
  Trash2,
  FileText,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react';
import WordPressInstaller from './WordPressInstaller';

interface WordPress {
  _id: string;
  name: string;
  domain: string;
  status: 'installing' | 'running' | 'stopped' | 'error';
  wpAdminUser: string;
  serverName?: string;
  createdAt: string;
}

export default function WordPressList() {
  const [wordpressSites, setWordpressSites] = useState<WordPress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstaller, setShowInstaller] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadWordPressSites();
  }, []);

  const loadWordPressSites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wordpress');
      setWordpressSites(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar sites WordPress');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      setActionLoading(id);
      await api.post(`/wordpress/${id}/start`);
      toast.success('WordPress iniciado');
      loadWordPressSites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar WordPress');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (id: string) => {
    try {
      setActionLoading(id);
      await api.post(`/wordpress/${id}/stop`);
      toast.success('WordPress parado');
      loadWordPressSites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao parar WordPress');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      setActionLoading(id);
      await api.post(`/wordpress/${id}/restart`);
      toast.success('WordPress reiniciado');
      loadWordPressSites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reiniciar WordPress');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await api.delete(`/wordpress/${id}`);
      toast.success('WordPress excluído');
      loadWordPressSites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir WordPress');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'stopped':
        return <Square className="w-5 h-5 text-gray-500" />;
      case 'installing':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Rodando';
      case 'stopped':
        return 'Parado';
      case 'installing':
        return 'Instalando...';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando sites WordPress...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sites WordPress</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas instalações WordPress
          </p>
        </div>
        <button
          onClick={() => setShowInstaller(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Instalar WordPress</span>
        </button>
      </div>

      {/* Empty State */}
      {wordpressSites.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-3xl mb-6">
            <svg className="w-20 h-20 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Nenhum site WordPress ainda</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Instale WordPress com um clique e comece a criar seu site
          </p>
          <button
            onClick={() => setShowInstaller(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-lg font-medium"
          >
            <Plus className="w-6 h-6" />
            <span>Instalar Primeiro WordPress</span>
          </button>
        </div>
      ) : (
        /* Sites List */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wordpressSites.map((wp) => (
            <div
              key={wp._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {wp.name}
                  </h3>
                  <a
                    href={`http://${wp.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {wp.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(wp.status)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getStatusText(wp.status)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Usuário Admin:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{wp.wpAdminUser}</span>
                </div>
                {wp.serverName && (
                  <div className="flex items-center justify-between">
                    <span>Servidor:</span>
                    <span className="text-gray-900 dark:text-white">{wp.serverName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Criado:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(wp.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`http://${wp.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Site
                </a>
                <a
                  href={`http://${wp.domain}/wp-admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Admin
                </a>
                
                {wp.status === 'stopped' ? (
                  <button
                    onClick={() => handleStart(wp._id)}
                    disabled={actionLoading === wp._id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                  >
                    {actionLoading === wp._id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Iniciar
                  </button>
                ) : wp.status === 'running' ? (
                  <>
                    <button
                      onClick={() => handleStop(wp._id)}
                      disabled={actionLoading === wp._id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm disabled:opacity-50"
                    >
                      {actionLoading === wp._id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Parar
                    </button>
                    <button
                      onClick={() => handleRestart(wp._id)}
                      disabled={actionLoading === wp._id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm disabled:opacity-50"
                    >
                      {actionLoading === wp._id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Reiniciar
                    </button>
                  </>
                ) : null}

                <button
                  onClick={() => handleDelete(wp._id, wp.name)}
                  disabled={actionLoading === wp._id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 ml-auto"
                >
                  {actionLoading === wp._id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Installer Modal */}
      {showInstaller && (
        <WordPressInstaller
          onClose={() => setShowInstaller(false)}
          onSuccess={() => {
            setShowInstaller(false);
            loadWordPressSites();
          }}
        />
      )}
    </div>
  );
}
