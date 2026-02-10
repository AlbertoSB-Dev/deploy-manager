'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import FileManager from './FileManager';
import { Server, FolderOpen, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileManagerDashboardProps {
  onClose: () => void;
}

export default function FileManagerDashboard({ onClose }: FileManagerDashboardProps) {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/servers');
      setServers(response.data);
      
      // Auto-selecionar primeiro servidor se houver
      if (response.data.length > 0 && !selectedServer) {
        setSelectedServer(response.data[0]._id);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar servidores');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-scaleIn">
          <div className="text-center">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4 animate-pulse">
              <FolderOpen className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Carregando Servidores</h3>
            <p className="text-gray-600 dark:text-gray-400">Aguarde um momento...</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="inline-flex p-6 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-3xl mb-6">
              <AlertCircle className="w-20 h-20 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Nenhum servidor configurado</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Adicione um servidor primeiro para gerenciar arquivos
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedServer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-3xl mb-6">
              <FolderOpen className="w-20 h-20 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Selecione um Servidor</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Escolha um servidor para gerenciar seus arquivos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <button
              key={server._id}
              onClick={() => setSelectedServer(server._id)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{server.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{server.host}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  server.status === 'online'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {server.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </button>
          ))}
        </div>
        </div>
      </div>
    );
  }

  const currentServer = servers.find(s => s._id === selectedServer);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Gerenciador de Arquivos</h2>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                  Navegue, edite e gerencie arquivos nos seus servidores
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="h-full flex flex-col">
      {/* Server Selector */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 mb-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block">Servidor Atual:</label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white cursor-pointer"
              >
                {servers.map((server) => (
                  <option key={server._id} value={server._id}>
                    {server.name} ({server.host})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentServer?.status === 'online'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {currentServer?.status === 'online' ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* File Manager */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <FileManager serverId={selectedServer} initialPath="/" />
      </div>
    </div>
        </div>
      </div>
    </div>
  );
}
