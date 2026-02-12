'use client';

import { useState, useEffect } from 'react';
import { Rocket, RotateCcw, Plus, Trash2, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

interface PanelVersion {
  _id: string;
  version: string;
  commit: string;
  message: string;
  status: 'building' | 'ready' | 'failed';
  createdAt: string;
  createdBy: string;
}

let io: any = null;

// Importar Socket.IO apenas no cliente
if (typeof window !== 'undefined') {
  const { io: socketIO } = require('socket.io-client');
  io = socketIO;
}

interface UpdateInfo {
  hasUpdates: boolean;
  localCommit: string;
  remoteCommit: string;
  updateInfo?: {
    commitsAhead: number;
    latestCommit: string;
    latestCommitMessage: string;
    latestCommitDate: string;
  };
}

export default function PanelDeployManager() {
  const [versions, setVersions] = useState<PanelVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newVersionMessage, setNewVersionMessage] = useState('');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    loadVersions();
    checkForUpdates();
    
    // Conectar ao Socket.IO apenas no cliente
    if (typeof window === 'undefined' || !io) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Conectado ao servidor de logs');
      socket.emit('join-panel-deploy');
    });

    socket.on('panel-deploy-log', (data: { message: string; timestamp: string }) => {
      setLogs(prev => [...prev, `[${new Date(data.timestamp).toLocaleTimeString()}] ${data.message}`]);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor de logs');
    });

    return () => {
      socket.emit('leave-panel-deploy');
      socket.disconnect();
    };
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/panel-deploy/versions');
      setVersions(response.data.versions);
      setCurrentVersion(response.data.currentVersion);
    } catch (error: any) {
      toast.error('Erro ao carregar versões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      setCheckingUpdates(true);
      const response = await api.get('/admin/check-updates');
      setUpdateInfo(response.data);
      
      if (response.data.hasUpdates) {
        toast.success(`${response.data.updateInfo.commitsAhead} atualização(ões) disponível(is)!`, {
          duration: 5000,
          icon: '🚀'
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar atualizações:', error);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleDeploy = async (version: string) => {
    if (!window.confirm(`Tem certeza que deseja fazer deploy da versão ${version}?`)) {
      return;
    }

    try {
      setDeploying(true);
      setLogs([]);
      setShowLogs(true);
      
      await api.post('/panel-deploy/deploy', { version });
      
      toast.success(`Deploy da versão ${version} iniciado`);
      
      // Aguardar um pouco e recarregar versões
      setTimeout(() => {
        loadVersions();
        setDeploying(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no deploy');
      setDeploying(false);
    }
  };

  const handleRollback = async (version?: string) => {
    if (!window.confirm(`Tem certeza que deseja fazer rollback${version ? ` para ${version}` : ''}?`)) {
      return;
    }

    try {
      setDeploying(true);
      setLogs([]);
      setShowLogs(true);
      
      await api.post('/panel-deploy/rollback', { version });
      
      toast.success('Rollback iniciado');
      
      setTimeout(() => {
        loadVersions();
        setDeploying(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no rollback');
      setDeploying(false);
    }
  };

  const handleDeleteVersion = async (version: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar a versão ${version}?`)) {
      return;
    }

    try {
      await api.delete(`/panel-deploy/versions/${version}`);
      toast.success(`Versão ${version} deletada`);
      loadVersions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar versão');
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersion) {
      toast.error('Digite uma versão');
      return;
    }

    if (!newVersion.match(/^v?\d+\.\d+\.\d+$/)) {
      toast.error('Formato inválido. Use: v1.0.0 ou 1.0.0');
      return;
    }

    try {
      await api.post('/panel-deploy/versions', {
        version: newVersion,
        message: newVersionMessage
      });
      
      toast.success(`Versão ${newVersion} criada`);
      setNewVersion('');
      setNewVersionMessage('');
      setShowNewVersionModal(false);
      loadVersions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar versão');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Carregando versões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Atualização Disponível */}
      {updateInfo?.hasUpdates && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white shadow-lg border border-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">
                  🎉 Nova Atualização Disponível!
                </h3>
              </div>
              
              <div className="ml-11 space-y-2">
                <p className="text-blue-100">
                  Há <span className="font-bold">{updateInfo.updateInfo?.commitsAhead} commit(s)</span> novos disponíveis no GitHub
                </p>
                
                {updateInfo.updateInfo && (
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-sm font-semibold mb-1">Última atualização:</p>
                    <p className="text-sm text-blue-100">
                      {updateInfo.updateInfo.latestCommitMessage}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-blue-200">
                      <span>
                        Commit: <code className="bg-white/20 px-2 py-0.5 rounded">{updateInfo.updateInfo.latestCommit}</code>
                      </span>
                      <span>
                        {new Date(updateInfo.updateInfo.latestCommitDate).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <p className="text-sm text-blue-100">
                    💡 <span className="font-semibold">Para aplicar esta atualização:</span>
                  </p>
                  <ol className="text-sm text-blue-100 mt-2 ml-4 space-y-1 list-decimal">
                    <li>Clique em "Nova Versão" para criar uma versão com as atualizações</li>
                    <li>Aguarde a construção da versão</li>
                    <li>Clique em "Deploy" na nova versão criada</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={checkForUpdates}
                disabled={checkingUpdates}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {checkingUpdates ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  'Verificar Novamente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-blue-600" />
              Deploy do Painel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Versão atual: <span className="font-semibold text-blue-600">{currentVersion}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={checkForUpdates}
              disabled={checkingUpdates}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {checkingUpdates ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Verificar Atualizações
                </>
              )}
            </button>
            <button
              onClick={() => setShowNewVersionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Versão
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      {showLogs && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Logs de Deploy</h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-sm text-green-400 space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500">Aguardando logs...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Versões */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Versões Disponíveis ({versions.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {versions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Nenhuma versão disponível
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version._id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {version.version}
                      </h4>
                      <div className="flex items-center gap-2">
                        {version.status === 'ready' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Pronto
                          </span>
                        )}
                        {version.status === 'building' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                            <Loader className="w-3 h-3 animate-spin" />
                            Construindo
                          </span>
                        )}
                        {version.status === 'failed' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Falhou
                          </span>
                        )}
                        {version.version === currentVersion && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full font-semibold">
                            ATUAL
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Commit: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {version.commit?.substring(0, 8) || 'N/A'}
                      </code>
                    </p>

                    {version.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {version.message}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Criado por {version.createdBy} em {new Date(version.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {version.status === 'ready' && version.version !== currentVersion && (
                      <>
                        <button
                          onClick={() => handleDeploy(version.version)}
                          disabled={deploying}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          <Rocket className="w-4 h-4" />
                          Deploy
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(version.version)}
                          disabled={deploying}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {version.version === currentVersion && (
                      <button
                        onClick={() => handleRollback()}
                        disabled={deploying || versions.length < 2}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nova Versão */}
      {showNewVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Criar Nova Versão
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Versão (ex: v1.0.0)
                </label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={newVersionMessage}
                  onChange={(e) => setNewVersionMessage(e.target.value)}
                  placeholder="Descreva as mudanças..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateVersion}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
