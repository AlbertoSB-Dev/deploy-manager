'use client';

import { useState } from 'react';
import { Rocket, GitBranch, Clock, Terminal as TerminalIcon, History, Trash2, FileText, Globe, Edit, Play, Square, Server } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LogViewer } from './LogViewer';
import { Terminal } from './Terminal';
import { DeployLogs } from './DeployLogs';
import { EditProjectModal } from './EditProjectModal';

interface ProjectCardProps {
  project: any;
  onUpdate: () => void;
  headerColor?: string;
}

export function ProjectCard({ project, onUpdate, headerColor }: ProjectCardProps) {
  const [deploying, setDeploying] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showDeployLogs, setShowDeployLogs] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [versions, setVersions] = useState<any>(null);
  const [containerAction, setContainerAction] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setShowDeployLogs(true); // Abrir modal de logs
      toast.loading('Iniciando deploy...', { id: 'deploy' });
      
      await api.post(`/projects/${project._id}/deploy`, {
        deployedBy: 'admin'
      });
      
      toast.success('Deploy concluído!', { id: 'deploy' });
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no deploy', { id: 'deploy' });
    } finally {
      setDeploying(false);
    }
  };

  const loadVersions = async () => {
    // Apenas abre o modal - os deploys já estão no project.deployments
    setShowVersions(true);
  };

  const handleRollbackToVersion = async (deploymentIndex: number) => {
    if (!confirm('Deseja fazer rollback para esta versão?')) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Fazendo rollback...', { id: 'rollback' });
      await api.post(`/projects/${project._id}/rollback`, {
        deploymentIndex,
        deployedBy: 'admin'
      });
      
      toast.success('Rollback concluído!', { id: 'rollback' });
      setShowVersions(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no rollback', { id: 'rollback' });
    } finally {
      setDeploying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar o projeto "${project.displayName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      toast.loading('Deletando projeto...', { id: 'delete' });
      await api.delete(`/projects/${project._id}`);
      toast.success('Projeto deletado com sucesso!', { id: 'delete' });
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar projeto', { id: 'delete' });
    }
  };

  const handleStartContainer = async () => {
    try {
      setContainerAction(true);
      toast.loading('Iniciando container...', { id: 'container' });
      await api.post(`/projects/${project._id}/container/start`);
      toast.success('Container iniciado!', { id: 'container' });
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao iniciar container', { id: 'container' });
    } finally {
      setContainerAction(false);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      toast.loading('Verificando atualizações...', { id: 'update' });
      const response = await api.get(`/projects/${project._id}/check-updates`);
      
      if (response.data.hasUpdate) {
        toast.success('Nova versão disponível!', { id: 'update' });
      } else {
        toast.success('Projeto está atualizado', { id: 'update' });
      }
      onUpdate();
    } catch (error: any) {
      toast.error('Erro ao verificar atualizações', { id: 'update' });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleFastRollback = async () => {
    if (!confirm('Deseja fazer rollback rápido para a versão anterior?')) {
      return;
    }

    try {
      setDeploying(true);
      toast.loading('Fazendo rollback rápido...', { id: 'rollback' });
      const response = await api.post(`/projects/${project._id}/rollback/fast`, {
        deployedBy: 'admin'
      });
      
      if (response.data.type === 'fast') {
        toast.success('Rollback rápido concluído!', { id: 'rollback' });
      } else {
        toast.success('Rollback concluído!', { id: 'rollback' });
      }
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro no rollback', { id: 'rollback' });
    } finally {
      setDeploying(false);
    }
  };

  const handleStopContainer = async () => {
    try {
      setContainerAction(true);
      toast.loading('Parando container...', { id: 'container' });
      await api.post(`/projects/${project._id}/container/stop`);
      toast.success('Container parado!', { id: 'container' });
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao parar container', { id: 'container' });
    } finally {
      setContainerAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white shadow-lg shadow-green-500/50';
      case 'deploying': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 animate-pulse';
      case 'error': return 'bg-red-500 text-white shadow-lg shadow-red-500/50';
      default: return 'bg-gray-500 text-white shadow-lg shadow-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '● Ativo';
      case 'deploying': return '⚡ Deploying';
      case 'error': return '✕ Erro';
      default: return '○ Inativo';
    }
  };

  // Gerar domínio de fallback se não existir
  const getDisplayDomain = () => {
    if (project.domain) {
      return project.domain;
    }
    // Gerar domínio temporário para projetos antigos
    return `${project.name}.localhost`;
  };

  const displayDomain = getDisplayDomain();

  return (
    <>
      {/* Card compacto */}
      <div 
        onClick={() => setShowDetails(true)}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
      >
        {/* Header compacto */}
        <div 
          className="p-3"
          style={headerColor ? {
            background: `linear-gradient(to right, ${headerColor}, ${headerColor}dd)`
          } : {
            background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate">{project.displayName}</h3>
              <p className="text-xs text-blue-100 dark:text-blue-200 truncate">{project.name}</p>
            </div>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
          
          {/* Badge de atualização */}
          {project.hasUpdate && (
            <div className="mt-2 inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-white">Nova versão disponível</span>
            </div>
          )}
        </div>

        {/* Info rápida */}
        <div className="p-3 space-y-2">
          {project.serverName && (
            <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 font-medium">
              <Server className="w-3.5 h-3.5 mr-1.5" />
              <span className="truncate">🌐 {project.serverName}</span>
            </div>
          )}
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <GitBranch className="w-3.5 h-3.5 mr-1.5" />
            <span className="truncate">{project.branch}</span>
          </div>
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            <span className="truncate">{displayDomain}</span>
          </div>
          {project.deployments.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(new Date(project.deployments[project.deployments.length - 1].deployedAt), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors" onClick={(e) => e.stopPropagation()}>
            {/* Header do Modal */}
            <div 
            className="p-6 sticky top-0 z-10"
            style={headerColor ? {
              background: `linear-gradient(to right, ${headerColor}, ${headerColor}dd)`
            } : {
              background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'
            }}
          >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{project.displayName}</h2>
                  <p className="text-sm text-blue-100">{project.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
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
              
              {project.hasUpdate && (
                <div className="mt-3 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-400 text-green-900 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-900 rounded-full"></span>
                    Nova versão disponível
                  </span>
                  <button
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                    className="text-xs text-white hover:text-blue-100 underline"
                  >
                    {checkingUpdate ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{project.branch}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Versão</p>
                    <p className="font-semibold text-gray-900 dark:text-white font-mono text-sm">{project.currentVersion.substring(0, 8)}</p>
                  </div>
                </div>
                
                {project.port && (
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3">
                      <span className="text-orange-600 dark:text-orange-400 text-lg">🔌</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Porta</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{project.port}</p>
                    </div>
                  </div>
                )}
                
                {project.deployments.length > 0 && (
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl mr-3">
                      <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Último deploy</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formatDistanceToNow(new Date(project.deployments[project.deployments.length - 1].deployedAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Domínio em destaque */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl mr-3 flex-shrink-0">
                    <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Domínio</p>
                    <a 
                      href={`http://${displayDomain}${project.port ? ':' + project.port : ''}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold break-all flex items-center gap-2 flex-wrap"
                    >
                      {displayDomain}
                      {displayDomain.includes('localhost') && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full">
                          Local
                        </span>
                      )}
                      {displayDomain.includes('sslip.io') && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full">
                          Gerado
                        </span>
                      )}
                    </a>
                    
                    {displayDomain.includes('sslip.io') && project.port && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <span>💡</span>
                        <span>Acesso {project.serverId ? 'remoto' : 'local'}:</span>
                        <a 
                          href={`http://${project.serverHost || 'localhost'}:${project.port}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {project.serverHost || 'localhost'}:{project.port}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Botão Deploy */}
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {deploying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>Deploy</span>
                    </>
                  )}
                </button>
                
                {/* Grid de controles */}
                <div className="grid grid-cols-2 gap-3">
                  {project.status === 'active' ? (
                    <button
                      onClick={handleStopContainer}
                      disabled={containerAction}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 font-medium border-2 border-red-200 dark:border-red-800"
                    >
                      <Square className="w-4 h-4" />
                      <span>Parar</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartContainer}
                      disabled={containerAction}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition disabled:opacity-50 font-medium border-2 border-green-200 dark:border-green-800"
                    >
                      <Play className="w-4 h-4" />
                      <span>Iniciar</span>
                    </button>
                  )}
                  
                  {project.previousContainerId ? (
                    <button
                      onClick={handleFastRollback}
                      disabled={deploying}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition disabled:opacity-50 font-medium border-2 border-orange-200 dark:border-orange-800"
                    >
                      <History className="w-4 h-4" />
                      <span>Rollback</span>
                    </button>
                  ) : (
                    <button
                      onClick={loadVersions}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium border-2 border-gray-200 dark:border-gray-600"
                    >
                      <History className="w-4 h-4" />
                      <span>Versões</span>
                    </button>
                  )}
                </div>
                
                {/* Botões secundários */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowEdit(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                  >
                    <Edit className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowLogs(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                  >
                    <FileText className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowTerminal(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"
                  >
                    <TerminalIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Terminal</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex flex-col items-center justify-center p-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                  >
                    <Trash2 className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Deletar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <LogViewer
          projectId={project._id}
          projectName={project.displayName}
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* Terminal Modal */}
      {showTerminal && (
        <Terminal
          projectId={project._id}
          projectName={project.displayName}
          onClose={() => setShowTerminal(false)}
        />
      )}

      {/* Deploy Logs Modal */}
      {showDeployLogs && (
        <DeployLogs
          projectId={project._id}
          projectName={project.displayName}
          onClose={() => setShowDeployLogs(false)}
        />
      )}

      {/* Edit Project Modal */}
      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            onUpdate();
          }}
        />
      )}

      {/* Histórico de Deploys Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowVersions(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transition-colors" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Histórico de Deploys</h2>
                  <p className="text-sm text-purple-100 dark:text-purple-200 mt-1">{project.displayName}</p>
                </div>
                <button
                  onClick={() => setShowVersions(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Lista de Deploys */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {project.deployments && project.deployments.length > 0 ? (
                <div className="space-y-3">
                  {[...project.deployments].reverse().map((deployment: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border-2 transition ${
                        deployment.status === 'success' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700' 
                          : deployment.status === 'failed'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
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
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                              <p className="font-medium text-gray-900 dark:text-white">{deployment.branch}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Commit</p>
                              <p className="font-mono text-xs text-gray-900 dark:text-white">{deployment.commit.substring(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Versão</p>
                              <p className="font-medium text-gray-900 dark:text-white">{deployment.version}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Deploy por</p>
                              <p className="font-medium text-gray-900 dark:text-white">{deployment.deployedBy}</p>
                            </div>
                          </div>
                        </div>
                        
                        {deployment.status === 'success' && (
                          <button
                            onClick={() => {
                              const deploymentIndex = project.deployments.length - 1 - index;
                              handleRollbackToVersion(deploymentIndex);
                            }}
                            disabled={deploying}
                            className="ml-4 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <History className="w-4 h-4" />
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Nenhum deploy realizado ainda</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowVersions(false)}
                className="w-full px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
