'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Terminal as TerminalIcon, Send, Trash2, RefreshCw, X } from 'lucide-react';

interface Server {
  _id: string;
  name: string;
  host: string;
  port: number;
  username: string;
}

interface Container {
  id: string;
  name: string;
  type: 'project' | 'database';
  status: string;
  image: string;
  isRunning: boolean;
}

interface TerminalSSHProps {
  onClose: () => void;
}

export default function TerminalSSH({ onClose }: TerminalSSHProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    // Auto-scroll para o final do output
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Quando seleciona um servidor, carregar containers e mostrar pwd
    if (selectedServer) {
      loadContainers();
      showServerInfo();
    } else {
      setContainers([]);
    }
  }, [selectedServer]);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
    }
  };

  const loadContainers = async () => {
    if (!selectedServer) return;
    
    setLoadingContainers(true);
    try {
      const response = await api.get(`/servers/${selectedServer}/containers`);
      setContainers(response.data.containers || []);
    } catch (error) {
      console.error('Erro ao carregar containers:', error);
      setContainers([]);
    } finally {
      setLoadingContainers(false);
    }
  };

  const showServerInfo = async () => {
    if (!selectedServer) return;
    
    const server = servers.find(s => s._id === selectedServer);
    if (!server) return;

    setOutput([
      `✅ Conectado ao servidor: ${server.name} (${server.host})`,
      `📁 Executando: pwd...`
    ]);

    try {
      const response = await api.post(`/servers/${selectedServer}/exec`, {
        command: 'pwd'
      });

      if (response.data.output) {
        setOutput(prev => [
          ...prev.slice(0, -1),
          `📁 Diretório atual: ${response.data.output.trim()}`
        ]);
      }
    } catch (error: any) {
      setOutput(prev => [
        ...prev.slice(0, -1),
        `❌ Erro ao obter diretório: ${error.message}`
      ]);
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;
    if (!selectedServer && !selectedContainer) {
      setOutput(prev => [...prev, '❌ Selecione um servidor ou container primeiro']);
      return;
    }

    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // Adicionar comando ao output
    if (selectedContainer) {
      const container = containers.find(c => c.id === selectedContainer);
      setOutput(prev => [...prev, `[${timestamp}] ${container?.name} $ ${command}`]);
    } else {
      const server = servers.find(s => s._id === selectedServer);
      setOutput(prev => [...prev, `[${timestamp}] ${server?.name} $ ${command}`]);
    }

    try {
      let response;
      
      if (selectedContainer) {
        // Executar no container via docker exec
        response = await api.post(`/servers/${selectedServer}/exec`, {
          command: `docker exec ${selectedContainer} ${command}`
        });
      } else {
        // Executar no servidor
        response = await api.post(`/servers/${selectedServer}/exec`, {
          command: command
        });
      }

      // Adicionar output
      if (response.data.output !== undefined && response.data.output !== null) {
        const outputText = response.data.output.trim();
        if (outputText) {
          const lines = outputText.split('\n');
          setOutput(prev => [...prev, ...lines]);
        } else {
          // Comando executado mas sem output (ex: cd, comandos silenciosos)
          setOutput(prev => [...prev, '✅ Comando executado (sem output)']);
        }
      } else if (response.data.code === 0) {
        // Sucesso mas sem campo output
        setOutput(prev => [...prev, '✅ Comando executado com sucesso']);
      }
      
      if (response.data.error) {
        setOutput(prev => [...prev, `❌ Erro: ${response.data.error}`]);
      }
    } catch (error: any) {
      setOutput(prev => [...prev, `❌ Erro: ${error.response?.data?.error || error.message}`]);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-750">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TerminalIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Terminal SSH
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Execute comandos nos servidores e containers gerenciados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearOutput}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

        {/* Seletores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servidor
            </label>
            <select
              value={selectedServer}
              onChange={(e) => {
                setSelectedServer(e.target.value);
                setSelectedContainer('');
                setOutput([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um servidor</option>
              {servers.map((server) => (
                <option key={server._id} value={server._id}>
                  {server.name} ({server.host})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Container Gerenciado (opcional)
              </label>
              {selectedServer && (
                <button
                  onClick={loadContainers}
                  disabled={loadingContainers}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingContainers ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              )}
            </div>
            <select
              value={selectedContainer}
              onChange={(e) => {
                setSelectedContainer(e.target.value);
              }}
              disabled={!selectedServer || loadingContainers}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Executar no servidor</option>
              {loadingContainers ? (
                <option disabled>Carregando containers...</option>
              ) : containers.length === 0 ? (
                <option disabled>Nenhum container gerenciado</option>
              ) : (
                containers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.type === 'project' ? '📦' : '🗄️'} {container.name} {container.isRunning ? '🟢' : '🔴'}
                  </option>
                ))
              )}
            </select>
            {selectedServer && containers.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {containers.filter(c => c.isRunning).length} de {containers.length} containers ativos
                {' • '}
                {containers.filter(c => c.type === 'project').length} projetos
                {' • '}
                {containers.filter(c => c.type === 'database').length} bancos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-gray-900 p-6 font-mono text-sm flex-1 overflow-y-auto" ref={outputRef}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-4 text-gray-400">Terminal SSH</span>
        </div>

        {output.length === 0 ? (
          <div className="text-gray-500 space-y-2">
            <div>$ Bem-vindo ao Terminal SSH</div>
            <div>$ Selecione um servidor acima para começar</div>
            <div>$ Opcionalmente, selecione um container gerenciado (projeto ou banco)</div>
            <div className="mt-4 text-gray-400">Comandos úteis no servidor:</div>
            <div className="ml-4 text-gray-400">• ls -la (listar arquivos)</div>
            <div className="ml-4 text-gray-400">• pwd (diretório atual)</div>
            <div className="ml-4 text-gray-400">• df -h (espaço em disco)</div>
            <div className="ml-4 text-gray-400">• free -h (memória)</div>
            <div className="ml-4 text-gray-400">• docker ps (containers rodando)</div>
            <div className="mt-4 text-gray-400">Comandos úteis no container:</div>
            <div className="ml-4 text-gray-400">• ls -la (listar arquivos do container)</div>
            <div className="ml-4 text-gray-400">• cat package.json (ver arquivo)</div>
            <div className="ml-4 text-gray-400">• npm list (pacotes instalados)</div>
          </div>
        ) : (
          <div className="space-y-1">
            {output.map((line, index) => {
              const isError = line.includes('❌');
              const isSuccess = line.includes('✅');
              const isInfo = line.includes('📁');
              const isCommand = line.includes('$');
              
              return (
                <div 
                  key={index} 
                  className={
                    isError ? 'text-red-400' :
                    isSuccess ? 'text-green-400' :
                    isInfo ? 'text-blue-400' :
                    isCommand ? 'text-cyan-400' :
                    'text-gray-300'
                  }
                >
                  {line}
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="text-yellow-400 animate-pulse mt-2">
            ⏳ Executando comando...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedContainer 
                ? "Comando no container (ex: ls -la, cat package.json)..." 
                : "Comando no servidor (ex: ls -la, docker ps)..."
            }
            disabled={loading || !selectedServer}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
          <button
            onClick={executeCommand}
            disabled={loading || !command.trim() || !selectedServer}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Executar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pressione Enter para executar • {selectedContainer ? 'Executando no container' : 'Executando no servidor'}
        </p>
      </div>
    </div>
    </div>
  );
}
