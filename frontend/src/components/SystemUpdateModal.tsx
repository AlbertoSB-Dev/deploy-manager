'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader, Terminal, RefreshCcw } from 'lucide-react';

interface SystemUpdateModalProps {
  serverId: string;
  serverName: string;
  onClose: () => void;
  onComplete: () => void;
}

export function SystemUpdateModal({ serverId, serverName, onClose, onComplete }: SystemUpdateModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'updating' | 'success' | 'error'>('updating');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Conectar ao WebSocket para logs em tempo real
    const socket = (window as any).io?.(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8001');
    
    if (socket) {
      // Escutar logs de atualização
      socket.on('system-update:log', (data: any) => {
        if (data.serverId === serverId) {
          setLogs((prev) => [...prev, data.log]);
          
          // Atualizar progresso baseado nos logs
          if (data.log.includes('Atualizando sistema')) setProgress(20);
          else if (data.log.includes('Instalando dependências')) setProgress(40);
          else if (data.log.includes('Instalando Docker')) setProgress(60);
          else if (data.log.includes('Limpando cache')) setProgress(80);
          else if (data.log.includes('Verificando instalações')) setProgress(90);
          else if (data.log.includes('✅')) setProgress(100);
        }
      });
      
      socket.on('system-update:complete', (data: any) => {
        if (data.serverId === serverId) {
          setStatus('success');
          setProgress(100);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      });
      
      socket.on('system-update:error', (data: any) => {
        if (data.serverId === serverId) {
          setStatus('error');
          setLogs((prev) => [...prev, `❌ Erro: ${data.error}`]);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('system-update:log');
        socket.off('system-update:complete');
        socket.off('system-update:error');
        socket.disconnect();
      }
    };
  }, [serverId, onComplete]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <RefreshCcw className="w-6 h-6 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Atualização concluída!';
      case 'error':
        return 'Erro na atualização';
      default:
        return 'Atualizando sistema...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={status === 'success' ? onClose : undefined}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Atualização do Sistema</h2>
              <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                {serverName}
              </p>
            </div>
            {status !== 'updating' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition text-white"
              >
                <X className="w-6 h-6" />
              </button>
            )}
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
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {progress}% concluído
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                <span className="text-sm font-mono text-gray-400">root@{serverName.toLowerCase().replace(/\s+/g, '-')} ~ apt update && apt upgrade</span>
              </div>
            </div>
            
            {/* Terminal Body */}
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="flex gap-2">
                  <span className="text-green-400">$</span>
                  <span className="text-gray-500">Iniciando atualização do sistema...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-green-400 select-none">$</span>
                      <span className={`whitespace-pre-wrap break-all ${
                        log.includes('❌') || log.includes('Erro') ? 'text-red-400' :
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('⚙️') || log.includes('Executando') ? 'text-blue-400' :
                        log.includes('⚠️') ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}>{log}</span>
                    </div>
                  ))}
                  {status === 'updating' && (
                    <div className="flex gap-2 animate-pulse">
                      <span className="text-green-400">$</span>
                      <span className="text-gray-500">_</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          {status === 'updating' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ Não feche esta janela</strong>
                <br />
                A atualização pode levar alguns minutos. O sistema está atualizando pacotes, instalando dependências e limpando cache.
              </p>
            </div>
          )}

          {/* Botão Fechar (apenas quando concluído) */}
          {status !== 'updating' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
