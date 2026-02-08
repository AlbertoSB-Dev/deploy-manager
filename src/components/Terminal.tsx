'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface TerminalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

export function Terminal({ projectId, projectName, onClose }: TerminalProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [executing, setExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeCommand = async () => {
    if (!command.trim() || executing) return;

    try {
      setExecuting(true);
      const response = await api.post(`/projects/${projectId}/exec`, {
        command: command.trim()
      });

      setHistory([
        ...history,
        {
          command: command.trim(),
          output: response.data.output,
          timestamp: new Date()
        }
      ]);

      setCommand('');
      
      // Auto scroll to bottom
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao executar comando');
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Terminal Interativo</h2>
            <p className="text-sm text-gray-600">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-sm">
          {history.length === 0 && (
            <div className="text-gray-500 mb-4">
              Digite um comando para executar no container...
            </div>
          )}
          
          {history.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="text-blue-400">
                $ {item.command}
              </div>
              <pre className="text-green-400 whitespace-pre-wrap break-words mt-1">
                {item.output}
              </pre>
            </div>
          ))}
          
          <div ref={terminalEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-mono">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={executing}
              placeholder="Digite um comando (ex: ls, pwd, npm --version)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:opacity-50"
            />
            <button
              onClick={executeCommand}
              disabled={!command.trim() || executing}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Executar"
            >
              {executing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pressione Enter para executar o comando
          </p>
        </div>
      </div>
    </div>
  );
}
