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
  const [currentDir, setCurrentDir] = useState<string>('~');
  const [username, setUsername] = useState<string>('root');
  const [hostname, setHostname] = useState<string>('server');
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

    setOutput([]);
    setUsername(server.username);

    try {
      // Obter hostname
      const hostnameResponse = await api.post(`/servers/${selectedServer}/exec`, {
        command: 'hostname'
      });
      
      if (hostnameResponse.data.output) {
        setHostname(hostnameResponse.data.output.trim());
      }

      // Obter diretório atual
      const pwdResponse = await api.post(`/servers/${selectedServer}/exec`, {
        command: 'pwd'
      });

      if (pwdResponse.data.output) {
        setCurrentDir(pwdResponse.data.output.trim());
      }
    } catch (error: any) {
      console.error('Erro ao obter informações do servidor:', error);
    }
  };

  const executeCommand = async () => {
    if (!command.trim()) return;
    if (!selectedServer && !selectedContainer) {
      setOutput(prev => [...prev, '❌ Selecione um servidor ou container primeiro']);
      return;
    }

    setLoading(true);
    
    // Mostrar prompt + comando
    const prompt = selectedContainer 
      ? `${username}@container:${currentDir}#`
      : `${username}@${hostname}:${currentDir}#`;
    
    setOutput(prev => [...prev, `${prompt} ${command}`]);

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

      // Adicionar output (sem mensagens de sucesso)
      if (response.data.output !== undefined && response.data.output !== null) {
        const outputText = response.data.output.trim();
        if (outputText) {
          const lines = outputText.split('\n');
          setOutput(prev => [...prev, ...lines]);
        }
      }
      
      if (response.data.error) {
        setOutput(prev => [...prev, `bash: ${command.split(' ')[0]}: ${response.data.error}`]);
      }

      // Atualizar diretório atual se o comando foi cd
      if (command.trim().startsWith('cd ') || command.trim() === 'cd') {
        try {
          const pwdResponse = await api.post(`/servers/${selectedServer}/exec`, {
            command: 'pwd'
          });
          if (pwdResponse.data.output) {
            setCurrentDir(pwdResponse.data.output.trim());
          }
        } catch (error) {
          console.error('Erro ao atualizar diretório:', error);
        }
      }
    } catch (error: any) {
      setOutput(prev => [...prev, `bash: ${error.response?.data?.error || error.message}`]);
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
            <div>Bem-vindo ao Terminal SSH</div>
            <div>Selecione um servidor acima para começar</div>
          </div>
        ) : (
          <div className="space-y-0">
            {output.map((line, index) => {
              const isPrompt = line.includes('@') && line.includes('#');
              const isError = line.includes('bash:') || line.includes('error:');
              
              return (
                <div 
                  key={index} 
                  className={
                    isPrompt ? 'text-green-400 font-bold' :
                    isError ? 'text-red-400' :
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
          <div className="text-green-400 animate-pulse mt-1">
            <span className="inline-block w-2 h-4 bg-green-400"></span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <span className="text-green-400 font-mono font-bold whitespace-nowrap">
            {selectedContainer 
              ? `${username}@container:${currentDir}#`
              : `${username}@${hostname}:${currentDir}#`
            }
          </span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando..."
            disabled={loading || !selectedServer}
            className="flex-1 px-2 py-1 bg-transparent border-none text-white placeholder-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Pressione Enter para executar
        </p>
      </div>
    </div>
    </div>
  );
}
