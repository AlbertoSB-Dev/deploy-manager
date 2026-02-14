'use client';

import { useState, useEffect, useRef } from 'react';
import { Rocket, AlertTriangle, CheckCircle, Loader, Terminal as TerminalIcon } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface DeployVersionModalProps {
  projectId: string;
  projectName: string;
  existingVersions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeployVersionModal({ 
  projectId, 
  projectName, 
  existingVersions,
  onClose, 
  onSuccess 
}: DeployVersionModalProps) {
  const [version, setVersion] = useState('');
  const [versionType, setVersionType] = useState<'new' | 'existing'>('new');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Auto-scroll para o final dos logs
  useEffect(() => {
    if (logsEndRef.current && deploying) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deployLogs, deploying]);

  // Limpar socket ao desmontar
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Sugerir próxima versão
  useEffect(() => {
    // Filtrar apenas versões semânticas válidas
    const semanticVersions = existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/));
    
    if (semanticVersions.length > 0) {
      const lastVersion = semanticVersions[semanticVersions.length - 1];
      const nextVersion = incrementVersion(lastVersion);
      setVersion(nextVersion);
    } else {
      setVersion('v1.0.0');
    }
  }, [existingVersions]);

  // Verificar se versão já existe
  useEffect(() => {
    if (versionType === 'new' && version) {
      const exists = existingVersions.includes(version);
      setShowWarning(exists);
    } else {
      setShowWarning(false);
    }
  }, [version, versionType, existingVersions]);

  const incrementVersion = (ver: string): string => {
    // Remove 'v' se existir
    const cleanVer = ver.replace(/^v/, '');
    const parts = cleanVer.split('.');
    
    if (parts.length === 3) {
      const [major, minor, patch] = parts.map(Number);
      // Incrementa patch
      return `v${major}.${minor}.${patch + 1}`;
    }
    
    return 'v1.0.0';
  };

  const handleDeploy = async () => {
    const finalVersion = versionType === 'new' ? version : selectedVersion;

    if (!finalVersion) {
      toast.error('Selecione ou digite uma versão');
      return;
    }

    // Validar formato da versão
    if (versionType === 'new' && !finalVersion.match(/^v?\d+\.\d+\.\d+$/)) {
      toast.error('Formato de versão inválido. Use: v1.0.0 ou 1.0.0');
      return;
    }

    // Adicionar 'v' se não tiver
    const formattedVersion = finalVersion.startsWith('v') ? finalVersion : `v${finalVersion}`;

    try {
      setDeploying(true);
      setShowTerminal(true);
      setDeployLogs([]);
      toast.loading('Iniciando deploy...', { id: 'deploy' });

      // Conectar ao WebSocket para receber logs em tempo real
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '');
      
      const socket = io(wsUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 WebSocket conectado para logs de deploy');
        setDeployLogs(prev => [...prev, '🔌 Conectado ao servidor de logs']);
        // Entrar na sala do projeto para receber logs específicos
        socket.emit('join-deploy', projectId);
      });

      socket.on('deploy-log', (data: { projectId?: string; message: string; timestamp: string }) => {
        console.log('📝 Log recebido:', data);
        setDeployLogs(prev => [...prev, data.message]);
      });

      socket.on('deploy-complete', (data: { projectId?: string; success: boolean; message?: string }) => {
        console.log('✅ Deploy completo:', data);
        if (data.success) {
          setDeployLogs(prev => [...prev, '✅ Deploy concluído com sucesso!']);
          toast.success(`Deploy da versão ${formattedVersion} concluído!`, { id: 'deploy' });
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else {
          setDeployLogs(prev => [...prev, `❌ Deploy falhou: ${data.message || 'Erro desconhecido'}`]);
          toast.error('Deploy falhou', { id: 'deploy' });
        }
        setDeploying(false);
      });

      socket.on('disconnect', () => {
        console.log('🔌 WebSocket desconectado');
      });
      
      // Iniciar deploy
      await api.post(`/projects/${projectId}/deploy`, {
        version: formattedVersion,
        deployedBy: 'admin'
      });
      
    } catch (error: any) {
      setDeployLogs(prev => [...prev, `❌ Erro: ${error.response?.data?.error || error.message}`]);
      toast.error(error.response?.data?.error || 'Erro no deploy', { id: 'deploy' });
      setDeploying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full transition-colors animate-scaleIn" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Deploy do Projeto</h2>
                <p className="text-sm text-blue-100 mt-1">{projectName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tipo de Deploy */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Deploy
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVersionType('new')}
                className={`p-4 rounded-xl border-2 transition ${
                  versionType === 'new'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🆕</div>
                  <div className="font-semibold text-gray-900 dark:text-white">Nova Versão</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Criar nova versão</div>
                </div>
              </button>
              
              <button
                onClick={() => setVersionType('existing')}
                disabled={existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/)).length === 0}
                className={`p-4 rounded-xl border-2 transition ${
                  versionType === 'existing'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/)).length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-semibold text-gray-900 dark:text-white">Versão Existente</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Redeploy de versão</div>
                </div>
              </button>
            </div>
          </div>

          {/* Nova Versão */}
          {versionType === 'new' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número da Versão
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0.0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Formato: v1.0.0 ou 1.0.0 (major.minor.patch)
              </p>

              {/* Aviso de versão existente */}
              {showWarning && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      Versão já existe!
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                      Esta versão já foi deployada anteriormente. O deploy irá sobrescrever o container existente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Versão Existente */}
          {versionType === 'existing' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecione a Versão
              </label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione uma versão...</option>
                {existingVersions
                  .filter(ver => ver.match(/^v?\d+\.\d+\.\d+$/)) // Apenas versões semânticas
                  .map((ver) => (
                    <option key={ver} value={ver}>
                      {ver}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Fazer redeploy de uma versão existente
              </p>
              {existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/)).length === 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ Nenhuma versão semântica disponível para redeploy
                </p>
              )}
            </div>
          )}

          {/* Versões Existentes */}
          {existingVersions.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Versões Deployadas ({existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/)).length})
              </label>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {existingVersions
                    .filter(ver => ver.match(/^v?\d+\.\d+\.\d+$/)) // Apenas versões semânticas
                    .map((ver) => (
                      <span
                        key={ver}
                        className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {ver}
                      </span>
                    ))}
                  {existingVersions.filter(v => v.match(/^v?\d+\.\d+\.\d+$/)).length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma versão semântica encontrada. Comece com v1.0.0
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deploying}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeploy}
              disabled={deploying || (versionType === 'new' && !version) || (versionType === 'existing' && !selectedVersion)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {deploying ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>Fazer Deploy</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal de Logs */}
          {showTerminal && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <TerminalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Logs do Deploy
                </h3>
                {deploying && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Em execução
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {deployLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <TerminalIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aguardando logs do deploy...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {deployLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-gray-300 ${
                          log.includes('error') || log.includes('Error') || log.includes('ERROR') || log.includes('❌')
                            ? 'text-red-400'
                            : log.includes('warn') || log.includes('Warning') || log.includes('WARN') || log.includes('⚠️')
                            ? 'text-yellow-400'
                            : log.includes('success') || log.includes('Success') || log.includes('✅')
                            ? 'text-green-400'
                            : log.includes('🔌') || log.includes('📦') || log.includes('🚀')
                            ? 'text-blue-400'
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
