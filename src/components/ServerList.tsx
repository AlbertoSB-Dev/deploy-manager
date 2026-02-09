'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, Trash2, Settings, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AddServerModal } from './AddServerModal';
import { ProvisioningModal } from './ProvisioningModal';
import { ServerMonitorModal } from './ServerMonitorModal';

interface ServerData {
  _id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  status: 'online' | 'offline' | 'error';
  provisioningStatus: 'pending' | 'provisioning' | 'ready' | 'error';
  provisioningProgress: number;
  osType?: string;
  osVersion?: string;
  installedSoftware: {
    docker: boolean;
    dockerCompose: boolean;
    git: boolean;
    nodejs: boolean;
  };
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  projects: string[];
  createdAt: string;
}

export function ServerList() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [provisioningServerId, setProvisioningServerId] = useState<string | null>(null);
  const [monitoringServerId, setMonitoringServerId] = useState<string | null>(null);
  const [monitoringServerName, setMonitoringServerName] = useState<string>('');

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar servidores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serverId: string, serverName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o servidor "${serverName}"?`)) {
      return;
    }

    try {
      toast.loading('Deletando servidor...', { id: 'delete' });
      await api.delete(`/servers/${serverId}`);
      toast.success('Servidor deletado!', { id: 'delete' });
      loadServers();
    } catch (error: any) {
      toast.error('Erro ao deletar servidor', { id: 'delete' });
    }
  };

  const handleTest = async (serverId: string) => {
    try {
      toast.loading('Testando conexão...', { id: 'test' });
      const response = await api.post(`/servers/${serverId}/test`);
      
      if (response.data.success) {
        toast.success('Conexão estabelecida!', { id: 'test' });
      } else {
        toast.error('Falha na conexão', { id: 'test' });
      }
      loadServers();
    } catch (error: any) {
      toast.error('Erro ao testar conexão', { id: 'test' });
    }
  };

  const handleReprovision = async (serverId: string) => {
    if (!confirm('Deseja reprovisionar este servidor? Isso reinstalará todas as dependências.')) {
      return;
    }

    try {
      await api.post(`/servers/${serverId}/reprovision`);
      toast.success('Reprovisioning iniciado!');
      setProvisioningServerId(serverId);
    } catch (error: any) {
      toast.error('Erro ao iniciar reprovisioning');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProvisioningBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">✓ Pronto</span>;
      case 'provisioning':
        return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full animate-pulse">⚙️ Provisionando</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">✕ Erro</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">⏳ Pendente</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Servidores</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus servidores VPS remotos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadServers}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Adicionar Servidor
          </button>
        </div>
      </div>

      {/* Lista de Servidores */}
      {servers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Server className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum servidor cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Adicione seu primeiro servidor VPS para começar
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Adicionar Servidor
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <div
              key={server._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(server.status)}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {server.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {server.host}:{server.port} • {server.username}
                      </p>
                    </div>
                    {getProvisioningBadge(server.provisioningStatus)}
                  </div>

                  {server.osType && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span>🖥️ {server.osType} {server.osVersion}</span>
                      <span>📦 {server.projects.length} projetos</span>
                    </div>
                  )}

                  {server.provisioningStatus === 'ready' && (
                    <div className="flex items-center gap-3 text-xs">
                      {server.installedSoftware.docker && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          🐳 Docker
                        </span>
                      )}
                      {server.installedSoftware.git && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                          📦 Git
                        </span>
                      )}
                      {server.installedSoftware.nodejs && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          ⚡ Node.js
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMonitoringServerId(server._id);
                      setMonitoringServerName(server.name);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Monitorar servidor"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  {server.provisioningStatus === 'provisioning' && (
                    <button
                      onClick={() => setProvisioningServerId(server._id)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Ver progresso"
                    >
                      <Settings className="w-5 h-5 animate-spin" />
                    </button>
                  )}
                  {server.provisioningStatus === 'error' && (
                    <button
                      onClick={() => handleReprovision(server._id)}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                      title="Reprovisionar"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleTest(server._id)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                    title="Testar conexão"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(server._id, server.name)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadServers();
          }}
        />
      )}

      {provisioningServerId && (
        <ProvisioningModal
          serverId={provisioningServerId}
          onClose={() => {
            setProvisioningServerId(null);
            loadServers();
          }}
        />
      )}

      {monitoringServerId && (
        <ServerMonitorModal
          serverId={monitoringServerId}
          serverName={monitoringServerName}
          onClose={() => {
            setMonitoringServerId(null);
            setMonitoringServerName('');
          }}
        />
      )}
    </div>
  );
}
