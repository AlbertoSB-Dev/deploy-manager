'use client';

import { useState, useEffect } from 'react';
import { Database, HardDrive, Download, Upload, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, Loader, Server as ServerIcon, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Backup {
  _id: string;
  name: string;
  type: 'database' | 'project' | 'wordpress' | 'manual';
  resourceId: string;
  resourceName: string;
  size: number;
  status: 'creating' | 'completed' | 'failed' | 'restoring';
  storageType: 'local' | 'minio' | 's3';
  localPath?: string;
  remotePath?: string;
  bucket?: string;
  serverId?: string;
  serverName?: string;
  metadata: {
    databaseType?: string;
    version?: string;
    commit?: string;
    compressed: boolean;
    encryption: boolean;
  };
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

interface BackupManagerProps {
  resourceId?: string;
  resourceType?: 'database' | 'project' | 'wordpress';
}

export default function BackupManager({ resourceId, resourceType }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storageType, setStorageType] = useState<'local' | 'minio'>('local');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

  useEffect(() => {
    loadBackups();
  }, [resourceId, resourceType]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (resourceId) params.append('resourceId', resourceId);
      if (resourceType) params.append('type', resourceType);

      const response = await api.get(`/backups?${params.toString()}`);
      setBackups(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!resourceId || !resourceType) {
      toast.error('Selecione um recurso para fazer backup');
      return;
    }

    try {
      setCreating(true);
      toast.loading('Criando backup...', { id: 'create-backup' });

      await api.post(`/backups/${resourceType}/${resourceId}`, {
        storageType
      });

      toast.success('Backup criado com sucesso!', { id: 'create-backup' });
      setShowCreateModal(false);
      loadBackups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar backup', { id: 'create-backup' });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este backup?\n\nEsta ação irá sobrescrever os dados atuais.')) {
      return;
    }

    try {
      toast.loading('Restaurando backup...', { id: 'restore-backup' });

      await api.post(`/backups/${backupId}/restore`);

      toast.success('Backup restaurado com sucesso!', { id: 'restore-backup' });
      loadBackups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao restaurar backup', { id: 'restore-backup' });
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Tem certeza que deseja deletar este backup?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    try {
      toast.loading('Deletando backup...', { id: 'delete-backup' });

      await api.delete(`/backups/${backupId}`);

      toast.success('Backup deletado com sucesso!', { id: 'delete-backup' });
      loadBackups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar backup', { id: 'delete-backup' });
    }
  };

  const downloadBackup = async (backupId: string, backupName: string) => {
    try {
      toast.loading('Preparando download...', { id: 'download-backup' });

      const response = await api.get(`/backups/${backupId}/download`, {
        responseType: 'blob'
      });

      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backupName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Download iniciado!', { id: 'download-backup' });
    } catch (error: any) {
      toast.error('Erro ao fazer download', { id: 'download-backup' });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'creating':
      case 'restoring':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completo';
      case 'creating':
        return 'Criando...';
      case 'restoring':
        return 'Restaurando...';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'project':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'wordpress':
        return <ServerIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <HardDrive className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backups</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie backups e restaurações
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadBackups}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {resourceId && resourceType && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              Criar Backup
            </button>
          )}
        </div>
      </div>

      {/* Lista de Backups */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <HardDrive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum backup encontrado</p>
          {resourceId && resourceType && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Criar Primeiro Backup
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {backups.map((backup) => (
            <div
              key={backup._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Ícone do tipo */}
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    {getTypeIcon(backup.type)}
                  </div>

                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {backup.resourceName}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-full">
                        {backup.type}
                      </span>
                      {backup.serverName && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-xs font-medium text-purple-700 dark:text-purple-400 rounded-full flex items-center gap-1">
                          <ServerIcon className="w-3 h-3" />
                          {backup.serverName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(backup.status)}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getStatusText(backup.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tamanho</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {formatBytes(backup.size)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Armazenamento</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">
                          {backup.storageType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Criado</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {formatDistanceToNow(new Date(backup.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>

                    {backup.metadata.databaseType && (
                      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                        Tipo: {backup.metadata.databaseType.toUpperCase()}
                        {backup.metadata.version && ` • Versão: ${backup.metadata.version}`}
                      </div>
                    )}

                    {backup.error && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          <strong>Erro:</strong> {backup.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                {backup.status === 'completed' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreBackup(backup._id)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition"
                      title="Restaurar backup"
                    >
                      <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={() => downloadBackup(backup._id, backup.name)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title="Download backup"
                    >
                      <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => deleteBackup(backup._id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                      title="Deletar backup"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criar Backup */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Criar Novo Backup
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Armazenamento
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as 'local' | 'minio')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="local">Local (Servidor)</option>
                  <option value="minio">MinIO (S3)</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Atenção:</strong> O backup será criado do estado atual do recurso.
                  Este processo pode levar alguns minutos dependendo do tamanho.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={createBackup}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    Criar Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
