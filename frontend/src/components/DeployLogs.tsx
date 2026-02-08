'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface DeployLogsProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

interface LogEntry {
  message: string;
  timestamp: string;
}

export function DeployLogs({ projectId, projectName, onClose }: DeployLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conectar ao Socket.IO
    const socket = io('http://localhost:8001', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor Socket.IO');
      setIsConnected(true);
      
      // Entrar na sala do deploy
      socket.emit('join-deploy', projectId);
    });

    socket.on('deploy-log', (data: LogEntry) => {
      console.log('📝 Log recebido:', data);
      setLogs((prev) => [...prev, data]);
      
      // Auto scroll para o final
      setTimeout(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor Socket.IO');
      setIsConnected(false);
    });

    return () => {
      socket.emit('leave-deploy', projectId);
      socket.disconnect();
    };
  }, [projectId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deploy em Andamento</h2>
            <p className="text-sm text-gray-600">{projectName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Aguardando logs do deploy...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500 text-xs mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-green-400">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Os logs são atualizados em tempo real via WebSocket
          </p>
        </div>
      </div>
    </div>
  );
}
