'use client';

import { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface ProvisioningModalProps {
  serverId: string;
  onClose: () => void;
}

export function ProvisioningModal({ serverId, onClose }: ProvisioningModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Iniciando...');
  const [logs, setLogs] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carregar status inicial
    loadStatus();

    // Conectar ao WebSocket
    const newSocket = io('http://localhost:8001');
    setSocket(newSocket);

    newSocket.on('provisioning:progress', (data) => {
      if (data.serverId === serverId) {
        setProgress(data.progress);
        setStatus(data.status);
        setMessage(data.message);
      }
    });

    newSocket.on('provisioning:log', (data) => {
      if (data.serverId === serverId) {
        setLogs(prev => [...prev, data.log]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverId]);

  useEffect(() => {
    // Auto-scroll para o final dos logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadStatus = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/provisioning`);
      setProgress(response.data.progress);
      setStatus(response.data.status);
      setLogs(response.data.logs || []);
      
      if (response.data.error) {
        setMessage(`Erro: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await api.post(`/servers/${serverId}/reprovision`);
      setProgress(0);
      setStatus('provisioning');
      setMessage('Reiniciando provisioning...');
      setLogs([]);
    } catch (error) {
      console.error('Erro ao reprovisionar:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'provisioning':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'provisioning':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {status === 'ready' ? '✅ Servidor Pronto!' : 
                   status === 'error' ? '❌ Erro no Provisioning' :
                   '⚙️ Provisionando Servidor...'}
                </h2>
                <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">{message}</p>
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

        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📟 Logs em Tempo Real
          </h3>
          <div className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Aguardando logs...
              </div>
            ) : (
              <>
                {logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-3">
            {status === 'ready' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Concluir
              </button>
            )}
            {status === 'error' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <RefreshCw className="w-5 h-5 inline mr-2" />
                  Tentar Novamente
                </button>
              </>
            )}
            {status === 'provisioning' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium"
              >
                Fechar (continua em background)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
