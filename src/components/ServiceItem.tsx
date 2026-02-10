'use client';

import { useState } from 'react';
import { Play, Square, RefreshCw, Trash2, Settings, ExternalLink, Loader, CheckCircle, AlertCircle, Clock, GitBranch, Globe, Server as ServerIcon, Rocket, Edit, FileText, Terminal as TerminalIcon, History, HardDrive } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DeployVersionModal from './DeployVersionModal';
import BackupManager from './BackupManager';
import EditProjectModal from './EditProjectModal';

interface ServiceItemProps {
  item: any;
  type: 'project' | 'database' | 'wordpress';
  onDataUpdate?: () => void;
}

export default function ServiceItem({ item, type, onDataUpdate }: ServiceItemProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [localItem, setLocalItem] = useState(item); // Estado local para manter dados atualizados
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set()); // Versões expandidas
  const [showBackups, setShowBackups] = useState(false); // Modal de backups
  const [showEditModal, setShowEditModal] = useState(false); // Modal de edição

  const getStatusIcon = () => {
    const status = item.status;
    switch (status) {
      case 'active':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'stopped':
      case 'inactive':
        return <Square className="w-4 h-4 text-gray-500" />;
      case 'deploying':
      case 'installing':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    const status = item.status;
    switch (status) {
      case 'active':
      case 'running':
        return 'Rodando';
      case 'stopped':
      case 'inactive':
        return 'Parado';
      case 'deploying':
        return 'Deployando...';
      case 'installing':
        return 'Instalando...';
      case 'error':
      case 'failed':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading(true);
      if (type === 'project') {
        await api.post(`/projects/${item._id}/container/start`);
      } else if (type === 'wordpress') {
        await api.post(`/wordpress/${item._id}/start`);
      }
      toast.success('Iniciado com sucesso');
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading(true);
      if (type === 'project') {
        await api.post(`/projects/${item._id}/container/stop`);
      } else if (type === 'wordpress') {
        await api.post(`/wordpress/${item._id}/stop`);
      }
      toast.success('Parado com sucesso');
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao parar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    try {
      setActionLoading(true);
      if (type === 'project') {
        await api.post(`/projects/${item._id}/container/restart`);
      } else if (type === 'wordpress') {
        await api.post(`/wordpress/${item._id}/restart`);
      }
      toast.success('Reiniciado com sucesso');
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao reiniciar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const name = item.name || item.displayName;
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      if (type === 'project') {
        await api.delete(`/projects/${item._id}`);
      } else if (type === 'database') {
        await api.delete(`/databases/${item._id}`);
      } else if (type === 'wordpress') {
        await api.delete(`/wordpress/${item._id}`);
      }
      toast.success('Excluído com sucesso');
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (deploymentIndex: number) => {
    if (!confirm('Deseja fazer rollback para esta versão?')) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Fazendo rollback...', { id: 'rollback' });
      await api.post(`/projects/${item._id}/rollback`, {
        deploymentIndex,
        deployedBy: 'admin'
      });
      
      toast.success('Rollback concluído!', { id: 'rollback' });
      setShowVersions(false);
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no rollback', { id: 'rollback' });
    } finally {
      setDeploying(false);
    }
  };

  const handleFastRollback = async () => {
    if (!confirm('Deseja fazer rollback rápido para a versão anterior?')) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Fazendo rollback rápido...', { id: 'rollback' });
      await api.post(`/projects/${item._id}/rollback/fast`, {
        deployedBy: 'admin'
      });
      
      toast.success('Rollback rápido concluído!', { id: 'rollback' });
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no rollback', { id: 'rollback' });
    } finally {
      setDeploying(false);
    }
  };

  const handleDeleteVersion = async (version: string, containerId: string) => {
    if (!confirm(`Deseja deletar todos os containers da versão ${version}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Deletando containers...', { id: 'delete-version' });
      
      // Chamar API para deletar containers da versão
      await api.delete(`/projects/${localItem._id}/versions/${version}`);
      
      toast.success(`Versão ${version} deletada com sucesso!`, { id: 'delete-version' });
      
      // Atualizar dados localmente sem fechar o modal
      const updatedItem = await api.get(`/projects/${localItem._id}`);
      setLocalItem(updatedItem.data);
      
      // NÃO chamar onDataUpdate para não fechar o modal
      // onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar versão', { id: 'delete-version' });
    } finally {
      setDeploying(false);
    }
  };

  const handleDeleteSingleContainer = async (deploymentId: string, containerId: string, deploymentDate: string) => {
    if (!confirm(`Deseja deletar este container?\n\nContainer: ${containerId !== 'no-container' ? containerId.substring(0, 12) : 'sem ID'}\nDeploy: ${deploymentDate}\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Deletando container...', { id: 'delete-container' });
      
      // Chamar API para deletar container específico
      await api.delete(`/projects/${localItem._id}/deployments/${deploymentId}`);
      
      toast.success('Container deletado com sucesso!', { id: 'delete-container' });
      
      // Atualizar dados localmente sem fechar o modal
      const updatedItem = await api.get(`/projects/${localItem._id}`);
      setLocalItem(updatedItem.data);
      
      // NÃO chamar onDataUpdate para não fechar o modal
      // onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar container', { id: 'delete-container' });
    } finally {
      setDeploying(false);
    }
  };

  const isRunning = item.status === 'active' || item.status === 'running';
  const isStopped = item.status === 'stopped' || item.status === 'inactive';
  const name = item.name || item.displayName;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'bg-green-500 text-white';
      case 'deploying':
      case 'installing':
        return 'bg-blue-500 text-white animate-pulse';
      case 'error':
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <>
      <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
        <div className="flex items-center justify-between gap-3">
        {/* Info */}
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-gray-900 dark:text-white truncate">
                {name}
              </h5>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getStatusText()}
              </span>
            </div>
            {(item.domain || item.gitUrl) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {item.domain || item.gitUrl}
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Link Externo */}
          {item.domain && (
            <a
              href={`http://${item.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Abrir site"
            >
              <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </a>
          )}

          {/* Start/Stop/Restart */}
          {type !== 'database' && (
            <>
              {isStopped ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart();
                  }}
                  disabled={actionLoading}
                  className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                  title="Iniciar"
                >
                  {actionLoading ? (
                    <Loader className="w-4 h-4 text-green-600 dark:text-green-400 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </button>
              ) : isRunning ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStop();
                    }}
                    disabled={actionLoading}
                    className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors disabled:opacity-50"
                    title="Parar"
                  >
                    {actionLoading ? (
                      <Loader className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                    disabled={actionLoading}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50"
                    title="Reiniciar"
                  >
                    {actionLoading ? (
                      <Loader className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                </>
              ) : null}
            </>
          )}

          {/* Edit */}
          {type === 'project' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Editar Projeto"
            >
              <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          )}

          {/* Settings */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={actionLoading}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
            title="Excluir"
          >
            {actionLoading ? (
              <Loader className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
          </button>
        </div>
      </div>
    </div>

      {/* Modal de Detalhes */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{name}</h2>
                  <p className="text-sm text-blue-100 mt-1">
                    {type === 'project' && '📦 Projeto'}
                    {type === 'database' && '🗄️ Banco de Dados'}
                    {type === 'wordpress' && '📝 WordPress'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(localItem.status)}`}>
                    {getStatusText()}
                  </span>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {type === 'project' && (
                  <>
                    {item.branch && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                          <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.branch}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.currentVersion && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3">
                          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Versão</p>
                          <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">{item.currentVersion.substring(0, 8)}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.port && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3">
                          <span className="text-orange-600 dark:text-orange-400 text-lg">🔌</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Porta</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.port}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.deployments && item.deployments.length > 0 && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl mr-3">
                          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Último deploy</p>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {formatDistanceToNow(new Date(item.deployments[item.deployments.length - 1].deployedAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {type === 'database' && (
                  <>
                    {item.type && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3">
                          <span className="text-blue-600 dark:text-blue-400 text-lg">🗄️</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                          <p className="font-semibold text-gray-900 dark:text-white uppercase">{item.type}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.port && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3">
                          <span className="text-orange-600 dark:text-orange-400 text-lg">🔌</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Porta</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.port}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {type === 'wordpress' && (
                  <>
                    {item.wpAdminUser && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                          <span className="text-purple-600 dark:text-purple-400 text-lg">👤</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Admin User</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.wpAdminUser}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.wpAdminEmail && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3">
                          <span className="text-blue-600 dark:text-blue-400 text-lg">📧</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.wpAdminEmail}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Domínio em destaque */}
              {item.domain && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl mr-3 flex-shrink-0">
                      <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Domínio</p>
                      <a 
                        href={`http://${item.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold break-all flex items-center gap-2"
                      >
                        {item.domain}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Painel Admin para bancos de dados */}
              {type === 'database' && (item.consoleUrl || item.adminUrl) && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3 flex-shrink-0">
                      <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Painel Administrativo</p>
                      <a 
                        href={item.consoleUrl || item.adminUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold break-all flex items-center gap-2"
                      >
                        {item.type === 'minio' && 'MinIO Console'}
                        {item.type === 'mysql' && 'phpMyAdmin'}
                        {item.type === 'mariadb' && 'phpMyAdmin'}
                        {item.type === 'postgresql' && 'Adminer'}
                        {item.type === 'mongodb' && 'Mongo Express'}
                        {item.type === 'redis' && 'Redis Commander'}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Git URL para projetos */}
              {type === 'project' && item.gitUrl && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Repositório Git</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{item.gitUrl}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {/* Botão de Deploy para projetos */}
                {type === 'project' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeployModal(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg font-semibold"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Fazer Deploy</span>
                  </button>
                )}

                {/* Botões de controle */}
                {type !== 'database' && (
                  <div className="grid grid-cols-2 gap-3">
                    {isStopped ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart();
                        }}
                        disabled={actionLoading}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition disabled:opacity-50 font-medium border-2 border-green-200 dark:border-green-800"
                      >
                        {actionLoading ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                        <span>Iniciar</span>
                      </button>
                    ) : isRunning ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStop();
                          }}
                          disabled={actionLoading}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 font-medium border-2 border-red-200 dark:border-red-800"
                        >
                          {actionLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                          <span>Parar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestart();
                          }}
                          disabled={actionLoading}
                          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50 font-medium border-2 border-blue-200 dark:border-blue-800"
                        >
                          {actionLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-5 h-5" />
                          )}
                          <span>Reiniciar</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Botões de Rollback para projetos */}
                {type === 'project' && (
                  <div className="grid grid-cols-2 gap-3">
                    {item.previousContainerId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFastRollback();
                        }}
                        disabled={deploying}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition disabled:opacity-50 font-medium border-2 border-orange-200 dark:border-orange-800"
                      >
                        {deploying ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <History className="w-5 h-5" />
                        )}
                        <span>Rollback Rápido</span>
                      </button>
                    )}
                    
                    {localItem.deployments && localItem.deployments.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVersions(true);
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition font-medium border-2 border-purple-200 dark:border-purple-800"
                      >
                        <History className="w-5 h-5" />
                        <span>Ver Versões ({localItem.deployments.length})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Botão de Backups */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBackups(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-medium border-2 border-blue-200 dark:border-blue-800"
                >
                  <HardDrive className="w-5 h-5" />
                  <span>Gerenciar Backups</span>
                </button>

                {/* Botão de deletar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 font-medium border-2 border-red-200 dark:border-red-800"
                >
                  {actionLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  <span>Excluir {type === 'project' ? 'Projeto' : type === 'database' ? 'Banco' : 'WordPress'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Versões */}
      {showVersions && type === 'project' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => {
          setShowVersions(false);
          // Atualizar lista principal quando fechar o modal
          onDataUpdate?.();
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transition-colors animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Histórico de Versões</h2>
                  <p className="text-sm text-purple-100 dark:text-purple-200 mt-1">{name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowVersions(false);
                    // Atualizar lista principal quando fechar o modal
                    onDataUpdate?.();
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Lista de Versões Agrupadas */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {localItem.deployments && localItem.deployments.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Agrupar deploys por versão
                    const versionGroups: { [key: string]: any[] } = {};
                    localItem.deployments.forEach((deployment: any) => {
                      // SEMPRE usar a versão semântica se existir
                      const ver = deployment.version || deployment.commit || 'sem-versão';
                      
                      if (!versionGroups[ver]) {
                        versionGroups[ver] = [];
                      }
                      versionGroups[ver].push(deployment);
                    });

                    // Ordenar versões (mais recente primeiro)
                    const sortedVersions = Object.keys(versionGroups).sort((a, b) => {
                      const aDeployments = versionGroups[a];
                      const bDeployments = versionGroups[b];
                      const aLatest = aDeployments[aDeployments.length - 1].deployedAt;
                      const bLatest = bDeployments[bDeployments.length - 1].deployedAt;
                      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
                    });

                    return sortedVersions.map((version) => {
                      const deploys = versionGroups[version];
                      const latestDeploy = deploys[deploys.length - 1];
                      const actualIndex = localItem.deployments.indexOf(latestDeploy);
                      const isCurrent = actualIndex === localItem.deployments.length - 1;
                      
                      // Verificar se é versão semântica
                      const isSemanticVersion = version.match(/^v?\d+\.\d+\.\d+$/);
                      const displayVersion = isSemanticVersion ? version : `Commit: ${version.substring(0, 8)}`;
                      const isExpanded = expandedVersions.has(version);
                      
                      const toggleExpand = () => {
                        const newExpanded = new Set(expandedVersions);
                        if (isExpanded) {
                          newExpanded.delete(version);
                        } else {
                          newExpanded.add(version);
                        }
                        setExpandedVersions(newExpanded);
                      };

                      return (
                        <div key={version} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          {/* Header da Versão - Clicável */}
                          <div 
                            onClick={toggleExpand}
                            className={`p-4 cursor-pointer hover:bg-opacity-80 transition ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {/* Ícone de Expandir/Colapsar */}
                                <div className="text-gray-500 dark:text-gray-400">
                                  {isExpanded ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </div>
                                
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  isCurrent
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {displayVersion}
                                </div>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                    ★ Versão Atual
                                  </span>
                                )}
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {deploys.length} deploy{deploys.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {!isCurrent ? (
                                  <>
                                    <button
                                      onClick={() => handleRollback(actualIndex)}
                                      disabled={deploying || latestDeploy.status !== 'success'}
                                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                                      title={latestDeploy.status !== 'success' ? 'Apenas versões com sucesso podem ser ativadas' : 'Ativar esta versão'}
                                    >
                                      {deploying ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <History className="w-4 h-4" />
                                      )}
                                      Ativar
                                    </button>
                                    <button
                                      onClick={() => {
                                        console.log('🗑️ Deletando versão:', version);
                                        console.log('📦 Deploys nesta versão:', deploys.length);
                                        handleDeleteVersion(version, latestDeploy.containerId || '');
                                      }}
                                      disabled={deploying}
                                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                                      title="Deletar todos os containers desta versão"
                                    >
                                      {deploying ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                      Deletar Versão
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Versão em execução
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Deploys da Versão - Mostrar apenas se expandido */}
                          {isExpanded && (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                            {deploys.slice().reverse().map((deployment: any, idx: number) => {
                              const deploymentIndex = localItem.deployments.indexOf(deployment);
                              const isCurrentContainer = deployment.containerId === localItem.containerId;
                              
                              return (
                              <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      {isCurrentContainer && (
                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                                          ⚡ Rodando
                                        </span>
                                      )}
                                      {deployment.status === 'success' && (
                                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                                          ✓ Sucesso
                                        </span>
                                      )}
                                      {deployment.status === 'failed' && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                                          ✕ Falhou
                                        </span>
                                      )}
                                      {deployment.status === 'deploying' && (
                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full animate-pulse">
                                          ⚡ Deploying
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDistanceToNow(new Date(deployment.deployedAt), {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Versão</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{deployment.version || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{deployment.branch}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Commit</p>
                                        <p className="font-mono text-xs text-gray-900 dark:text-white">{deployment.commit.substring(0, 8)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Deploy por</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{deployment.deployedBy}</p>
                                      </div>
                                    </div>
                                    {deployment.containerId && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Container ID</p>
                                        <p className="font-mono text-xs text-gray-600 dark:text-gray-400">{deployment.containerId.substring(0, 12)}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Botões de ação para cada deploy */}
                                  <div className="flex items-center gap-2">
                                    {/* Botão de Rollback */}
                                    {!isCurrentContainer && deployment.status === 'success' && (
                                      <button
                                        onClick={() => {
                                          console.log('🔄 Rollback para deploy:', deploymentIndex);
                                          handleRollback(deploymentIndex);
                                        }}
                                        disabled={deploying}
                                        className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition disabled:opacity-50"
                                        title="Fazer rollback para esta versão"
                                      >
                                        {deploying ? (
                                          <Loader className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
                                        ) : (
                                          <History className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        )}
                                      </button>
                                    )}
                                    
                                    {/* Botão de Deletar */}
                                    {!isCurrentContainer && (
                                      <button
                                        onClick={() => {
                                          console.log('🗑️ Deletando container individual:', deploymentIndex);
                                          console.log('📦 Container ID:', deployment.containerId || 'sem ID');
                                          handleDeleteSingleContainer(
                                            deploymentIndex.toString(),
                                            deployment.containerId || 'no-container',
                                            formatDistanceToNow(new Date(deployment.deployedAt), { addSuffix: true, locale: ptBR })
                                          );
                                        }}
                                        disabled={deploying}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50"
                                        title={deployment.containerId ? 'Deletar este container' : 'Remover do histórico (sem container)'}
                                      >
                                        {deploying ? (
                                          <Loader className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhum deploy registrado ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Deploy com Versão */}
      {showDeployModal && type === 'project' && (
        <DeployVersionModal
          projectId={localItem._id}
          projectName={name}
          existingVersions={localItem.deployments ? [...new Set(localItem.deployments.map((d: any) => d.version).filter(Boolean))] : []}
          onClose={() => setShowDeployModal(false)}
          onSuccess={async () => {
            setShowDeployModal(false);
            // Atualizar dados localmente sem fechar o modal de versões
            const updatedItem = await api.get(`/projects/${localItem._id}`);
            setLocalItem(updatedItem.data);
            // NÃO chamar onDataUpdate para não fechar o modal de versões
            // onDataUpdate?.();
          }}
        />
      )}

      {/* Modal de Backups */}
      {showBackups && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowBackups(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-colors animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Backups - {name}</h2>
                  <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                    Gerencie backups e restaurações
                  </p>
                </div>
                <button
                  onClick={() => setShowBackups(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <BackupManager 
                resourceId={localItem._id} 
                resourceType={type} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && type === 'project' && (
        <EditProjectModal
          project={localItem}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            onDataUpdate?.();
          }}
        />
      )}
    </>
  );
}
