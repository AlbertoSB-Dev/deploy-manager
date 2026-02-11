'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Trash2, Pause, Play, RefreshCw } from 'lucide-react';

interface LiveLogsViewerProps {
  projectId: string;
  projectName: string;
}

export default function LiveLogsViewer({ projectId, projectName }: LiveLogsViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Função para carregar logs recentes
  const loadRecentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      
      const response = await fetch(`${apiUrl}/api/logs/${projectId}/recent?lines=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsConnected(true);
        const data = await response.json();
        const lines = data.combined.split('\n').filter((line: string) => line.trim());
        setLogs(lines);
      } else {
        setIsConnected(false);
        const error = await response.json();
        setLogs(prev => [...prev, `❌ Erro: ${error.error || 'Erro ao carregar logs'}`]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar logs recentes:', error);
      setIsConnected(false);
      setLogs(prev => [...prev, `❌ Erro de conexão: ${error.message}`]);
    }
  };

  // Auto-scroll para o final
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Detectar se usuário scrollou manualmente
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setAutoScroll(isAtBottom);
  };

  // Conectar ao stream de logs usando polling (mais confiável que SSE)
  useEffect(() => {
    if (isPaused) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setLogs(prev => [...prev, '❌ Token de autenticação não encontrado']);
      return;
    }

    // Carregar logs iniciais
    loadRecentLogs();

    // Polling a cada 3 segundos para novos logs
    const intervalId = setInterval(() => {
      loadRecentLogs();
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId, isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header com controles */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Logs em Tempo Real
          </h3>
          <div className="flex items-center gap-2 ml-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isPaused ? 'Retomar' : 'Pausar'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          <button
            onClick={scrollToBottom}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Ir para o final"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadLogs}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Baixar logs"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={clearLogs}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Limpar logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Container de logs */}
      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-900 p-4 font-mono text-sm"
        style={{ maxHeight: '500px' }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aguardando logs...</p>
              {!isConnected && (
                <p className="text-xs mt-2">Tentando conectar ao container...</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`text-gray-300 ${
                  log.includes('error') || log.includes('Error') || log.includes('ERROR')
                    ? 'text-red-400'
                    : log.includes('warn') || log.includes('Warning') || log.includes('WARN')
                    ? 'text-yellow-400'
                    : log.includes('success') || log.includes('Success') || log.includes('✅')
                    ? 'text-green-400'
                    : ''
                }`}
              >
                <span className="text-gray-600 select-none mr-2">{index + 1}</span>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer com informações */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>{logs.length} linhas</span>
          <span>
            Auto-scroll: {autoScroll ? '✅ Ativo' : '⏸️ Pausado'}
          </span>
        </div>
      </div>
    </div>
  );
}
