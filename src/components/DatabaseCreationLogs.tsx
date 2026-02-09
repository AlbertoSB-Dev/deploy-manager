'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

interface Log {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: Date;
}

interface DatabaseCreationLogsProps {
  databaseName: string;
  onComplete: (database: any) => void;
  onError: (error: string) => void;
}

export default function DatabaseCreationLogs({ databaseName, onComplete, onError }: DatabaseCreationLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Conectar ao Socket.IO
    const socket = io('http://localhost:8001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor Socket.IO');
      socket.emit('join-database', databaseName);
    });

    socket.on('database-log', (log: Log) => {
      setLogs(prev => [...prev, log]);
      
      // Verificar se completou
      if (log.message.includes('criado com sucesso')) {
        setIsComplete(true);
        setTimeout(() => {
          socket.disconnect();
        }, 2000);
      }
      
      // Verificar se teve erro
      if (log.type === 'error') {
        setHasError(true);
        onError(log.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor Socket.IO');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [databaseName, onError]);

  useEffect(() => {
    // Auto-scroll para o final
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Criando Banco de Dados
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {databaseName}
              </p>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              {!isComplete && !hasError && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="font-medium">Criando...</span>
                </div>
              )}
              {isComplete && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Concluído!</span>
                </div>
              )}
              {hasError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">Erro</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Aguardando logs...
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className={`${getLogColor(log.type)} flex items-start gap-2`}>
                  <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                  <span className="flex-1">{log.message}</span>
                  <span className="text-gray-600 text-xs flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {isComplete ? (
            <button
              onClick={async () => {
                // Buscar banco criado e chamar onComplete
                try {
                  const response = await api.get('/databases');
                  const db = response.data.find((d: any) => d.name === databaseName);
                  if (db) onComplete(db);
                } catch (error) {
                  console.error('Erro ao buscar banco:', error);
                }
              }}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Ver Credenciais
            </button>
          ) : hasError ? (
            <button
              onClick={() => onError('Erro ao criar banco de dados')}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400">
              Aguarde enquanto o banco de dados é criado...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
