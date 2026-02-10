'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Server as ServerIcon } from 'lucide-react';
import ServerCard from './ServerCard';
import toast from 'react-hot-toast';

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
  };
  servers: any[];
  projects: any[];
  databases: any[];
  wordpress: any[];
  onEdit?: (groupId: string) => void;
  onDelete?: (groupId: string) => void;
  onDataUpdate?: () => void;
  onMoveServer?: (serverId: string, targetGroupId: string) => void;
  allGroups?: any[];
}

export default function GroupCard({
  group,
  servers,
  projects,
  databases,
  wordpress,
  onEdit,
  onDelete,
  onDataUpdate,
  onMoveServer,
  allGroups = [],
}: GroupCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // Filtrar servidores do grupo
  const groupServers = group._id === 'ungrouped' 
    ? servers // Se for "Sem Grupo", já vem filtrado
    : servers.filter(s => s.groupId === group._id);
  
  const serverCount = groupServers.length;

  const handleEdit = () => {
    if (group._id === 'ungrouped') {
      toast.error('Não é possível editar o grupo padrão');
      return;
    }
    onEdit?.(group._id);
  };

  const handleDelete = () => {
    if (group._id === 'ungrouped') {
      toast.error('Não é possível excluir o grupo padrão');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      return;
    }
    onDelete?.(group._id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const serverId = e.dataTransfer.getData('serverId');
    if (serverId && onMoveServer) {
      onMoveServer(serverId, group._id);
    }
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
        dragOver 
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header do Grupo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-750/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <ServerIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {serverCount} {serverCount === 1 ? 'servidor' : 'servidores'}
              </span>
            </div>

            {group._id !== 'ungrouped' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEdit}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Editar grupo"
                >
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Excluir grupo"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Servidores do Grupo */}
      {expanded && (
        <div className="p-4 space-y-4">
          {groupServers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ServerIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum servidor neste grupo</p>
            </div>
          ) : (
            groupServers.map((server) => (
              <ServerCard
                key={server._id}
                server={server}
                projects={projects.filter(p => p.serverId === server._id)}
                databases={databases.filter(d => d.serverId === server._id)}
                wordpress={wordpress.filter(w => w.serverId === server._id)}
                onDataUpdate={onDataUpdate}
                onMoveServer={onMoveServer}
                allGroups={allGroups}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
