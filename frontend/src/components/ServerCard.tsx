'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Server as ServerIcon, Terminal, FolderOpen, Activity, RefreshCcw, Trash2 } from 'lucide-react';
import ServiceSection from './ServiceSection';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import TerminalSSH from './TerminalSSH';
import FileManagerDashboard from './FileManagerDashboard';
import { ServerMonitorModal } from './ServerMonitorModal';
import DeleteServerModal from './DeleteServerModal';

interface ServerCardProps {
  server: any;
  projects: any[];
  databases: any[];
  wordpress: any[];
  onDataUpdate?: () => void;
  onMoveServer?: (serverId: string, targetGroupId: string) => void;
  allGroups?: any[];
}

export default function ServerCard({
  server,
  projects,
  databases,
  wordpress,
  onDataUpdate,
  onMoveServer,
  allGroups = [],
}: ServerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const totalServices = projects.length + databases.length + wordpress.length;
  const isOnline = server.status === 'online';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('serverId', server._id);
  };

  const handleMoveToGroup = (groupId: string) => {
    if (onMoveServer) {
      onMoveServer(server._id, groupId);
    }
    setShowMoveMenu(false);
  };

  const handleUpdateSystem = async () => {
    if (!confirm('Deseja atualizar o sistema do servidor? Isso pode levar alguns minutos.')) {
      return;
    }
    
    try {
      setUpdating(true);
      toast.loading('Atualizando sistema...', { id: 'update-system' });
      await api.post(`/servers/${server._id}/update-system`);
      toast.success('Sistema atualizado com sucesso!', { id: 'update-system' });
      onDataUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar sistema', { id: 'update-system' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div 
      className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-move hover:shadow-md transition-all"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Header do Servidor */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <ServerIcon className={`w-5 h-5 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {server.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOnline
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {isOnline ? '● Online' : '● Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {server.host}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Contador de Serviços */}
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {totalServices} {totalServices === 1 ? 'serviço' : 'serviços'}
              </span>
            </div>

            {/* Ações Rápidas */}
            <button
              onClick={() => setShowTerminal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Terminal SSH"
            >
              <Terminal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowFiles(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Gerenciar Arquivos"
            >
              <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowMonitor(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Monitor"
            >
              <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleUpdateSystem}
              disabled={updating}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar Sistema"
            >
              <RefreshCcw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${updating ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Deletar Servidor"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
            
            {/* Botão Mover para Grupo */}
            {allGroups.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Mover para grupo"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
                
                {showMoveMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      Mover para:
                    </div>
                    {allGroups.map((g) => (
                      <button
                        key={g._id}
                        onClick={() => handleMoveToGroup(g._id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {g.icon || '📁'} {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Serviços do Servidor */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Projetos */}
          <ServiceSection
            title="Projetos"
            icon="🚀"
            count={projects.length}
            items={projects}
            type="project"
            onDataUpdate={onDataUpdate}
          />

          {/* Bancos de Dados */}
          <ServiceSection
            title="Bancos de Dados"
            icon="🗄️"
            count={databases.length}
            items={databases}
            type="database"
            onDataUpdate={onDataUpdate}
          />

          {/* WordPress */}
          <ServiceSection
            title="WordPress"
            icon="🌐"
            count={wordpress.length}
            items={wordpress}
            type="wordpress"
            onDataUpdate={onDataUpdate}
          />
        </div>
      )}

      {/* Modals */}
      {showTerminal && (
        <TerminalSSH onClose={() => setShowTerminal(false)} />
      )}

      {showFiles && (
        <FileManagerDashboard onClose={() => setShowFiles(false)} />
      )}

      {showMonitor && (
        <ServerMonitorModal
          serverId={server._id}
          serverName={server.name}
          onClose={() => setShowMonitor(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteServerModal
          server={server}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            setShowDeleteModal(false);
            onDataUpdate?.();
          }}
        />
      )}
    </div>
  );
}
