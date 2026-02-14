'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader, Terminal } from 'lucide-react';
import { api } from '@/lib/api';

interface ProvisioningStatusModalProps {
  serverId: string;
  serverName: string;
  onClose: () => void;
}

export function ProvisioningStatusModal({ serverId, serverName, onClose }: ProvisioningStatusModalProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    
    // Conectar ao WebSocket para atualizações em tempo real
    const socket = (window as any).io?.(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8001');
    
    if (socket) {
      // Escutar eventos de progresso
      socket.on('provisioning:progress', (data: any) => {
        if (data.serverId === serverId) {
          setStatus((prev: any) => ({
            ...prev,
            status: data.status,
            progress: data.progress
          }));
          
          // Adicionar mensagem aos logs
          if (data.message) {
            setStatus((prev: any) => ({
              ...prev,
              logs: [...(prev?.logs || []), data.message]
            }));
          }
        }
      });
      
      // Escutar logs
      socket.on('provisioning:log', (data: any) => {
        if (data.serverId === serverId) {
          setStatus((prev: any) => ({
            ...prev,
            logs: [...(prev?.logs || []), data.log]
          }));
        }
      });
    }
    
    // Fallback: polling a cada 3 segundos
    const interval = setInterval(loadStatus, 3000);
    
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('provisioning:progress');
        socket.off('provisioning:log');
        socket.disconnect();
      }
    };
  }, [serverId]);

  const loadStatus = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/provisioning`);
      setStatus(response.data);
      setLoading(false);
      
      // Parar de atualizar se concluído ou com erro
      if (response.data.status === 'ready' || response.data.status === 'error') {
        // Não parar, deixar usuário fechar manualmente
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <Loader className="w-6 h-6 animate-spin text-blue-500" />;
    
    switch (status.status) {
      case 'ready':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'provisioning':
        return <Loader className="w-6 h-6 animate-spin text-blue-500" />;
      default:
        return <Loader className="w-6 h-6 animate-spin text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Carregando...';
    
    switch (status.status) {
      case 'ready':
        return 'Servidor pronto!';
      case 'error':
        return 'Erro no provisionamento';
      case 'provisioning':
        return 'Provisionando servidor...';
      case 'pending':
        return 'Aguardando início...';
      default:
        return status.status;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100 dark:bg-gray-800';
    
    switch (status.status) {
      case 'ready':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'provisioning':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Provisionamento</h2>
              <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                {serverName}
              </p>
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
        <div className="p-6 space-y-4">
          {/* Status Card */}
          <div className={`border-2 rounded-xl p-6 ${getStatusColor()}`}>
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {getStatusText()}
                </h3>
                {status && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {status.progress || 0}% concluído
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Software Instalado */}
          {status?.installedSoftware && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Software Instalado
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  {status.installedSoftware.docker ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Docker</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.installedSoftware.dockerCompose ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Docker Compose</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.installedSoftware.git ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Git</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.installedSoftware.nodejs ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Node.js</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.installedSoftware.traefik ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Traefik</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.installedSoftware.network ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rede Coolify</span>
                </div>
              </div>
            </div>
          )}

          {/* Terminal de Logs */}
          <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
            {/* Terminal Header */}
            <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 border-b border-gray-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-sm font-mono text-gray-400">root@{serverName.toLowerCase().replace(/\s+/g, '-')}</span>
              </div>
            </div>
            
            {/* Terminal Body */}
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {status?.logs && status.logs.length > 0 ? (
                <div className="space-y-1">
                  {status.logs.map((log: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-green-400 select-none">$</span>
                      <span className="text-gray-300 whitespace-pre-wrap break-all">{log}</span>
                    </div>
                  ))}
                  {status.status === 'provisioning' && (
                    <div className="flex gap-2 animate-pulse">
                      <span className="text-green-400">$</span>
                      <span className="text-gray-500">_</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="text-green-400">$</span>
                  <span className="text-gray-500">Aguardando logs...</span>
                </div>
              )}
            </div>
          </div>

          {/* Erro */}
          {status?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                Erro
              </h4>
              <p className="text-sm text-red-800 dark:text-red-400">
                {status.error}
              </p>
            </div>
          )}

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
