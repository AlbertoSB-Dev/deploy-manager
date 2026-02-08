'use client';

import { useState, useEffect } from 'react';
import { X, Github, Server as ServerIcon } from 'lucide-react';
import GitHubConnect from './GitHubConnect';
import GitHubRepoSelector from './GitHubRepoSelector';
import { BranchSelector } from './BranchSelector';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateProjectWithGitHubProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectWithGitHub({ onClose, onSuccess }: CreateProjectWithGitHubProps) {
  const [step, setStep] = useState<'method' | 'github' | 'manual'>('method');
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; defaultBranch: string } | null>(null);
  const [servers, setServers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    gitUrl: '',
    branch: 'main',
    type: 'frontend',
    port: '',
    domain: '',
    buildCommand: '',
    startCommand: '',
    envVars: '',
    serverId: '' // Novo campo
  });
  const [creating, setCreating] = useState(false);

  // Carregar servidores disponíveis
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await api.get('/servers');
      // Filtrar apenas servidores prontos
      const readyServers = response.data.filter((s: any) => s.provisioningStatus === 'ready');
      setServers(readyServers);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
    }
  };

  const handleGitHubConnected = (token: string) => {
    setGithubToken(token);
    setGithubConnected(true);
  };

  const handleViewRepos = () => {
    setStep('github');
  };

  const handleRepoSelect = (repo: any) => {
    // Garantir que o nome seja lowercase e válido para Docker
    const projectName = repo.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Extrair owner do fullName (ex: "usuario/repo" -> "usuario")
    const owner = repo.fullName.split('/')[0];
    
    console.log('🔍 Repo selecionado:', { owner, repo: repo.name, defaultBranch: repo.defaultBranch });
    
    setSelectedRepo({
      owner,
      repo: repo.name,
      defaultBranch: repo.defaultBranch
    });
    
    setFormData({
      ...formData,
      name: projectName,
      displayName: repo.name,
      gitUrl: repo.cloneUrl,
      branch: repo.defaultBranch
    });
    setStep('manual'); // Ir para configuração manual
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      toast.loading('Criando projeto...', { id: 'create' });

      // Parse env vars
      const envVarsObj: Record<string, string> = {};
      if (formData.envVars) {
        formData.envVars.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVarsObj[key.trim()] = valueParts.join('=').trim();
          }
        });
      }

      // Se conectado via GitHub, usar token
      const gitAuth = githubToken ? {
        type: 'token',
        token: githubToken
      } : undefined;

      // Buscar nome do servidor se selecionado
      const selectedServer = servers.find(s => s._id === formData.serverId);

      await api.post('/projects', {
        ...formData,
        port: formData.port ? parseInt(formData.port) : undefined,
        domain: formData.domain || undefined,
        envVars: envVarsObj,
        gitAuth,
        serverId: formData.serverId || undefined,
        serverName: selectedServer?.name || undefined
      });

      toast.success('Projeto criado com sucesso!', { id: 'create' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar projeto', { id: 'create' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Projeto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">{/* Escolher Método */}
          {step === 'method' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Como deseja adicionar o projeto?</h3>
              
              {/* Opção GitHub */}
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white dark:bg-gray-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-900 dark:bg-gray-700 rounded-lg">
                    <Github className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Conectar com GitHub</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Conecte sua conta do GitHub e selecione um repositório facilmente
                    </p>
                    <GitHubConnect 
                      onConnected={handleGitHubConnected}
                      onViewRepos={handleViewRepos}
                    />
                  </div>
                </div>
              </div>

              {/* Opção Manual */}
              <button
                onClick={() => setStep('manual')}
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left bg-white dark:bg-gray-800"
              >
                <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Adicionar Manualmente</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Insira a URL do repositório Git manualmente
                </p>
              </button>
            </div>
          )}

          {/* Seletor de Repositório GitHub */}
          {step === 'github' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selecione um Repositório</h3>
                <button
                  onClick={() => setStep('method')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Voltar
                </button>
              </div>
              <GitHubRepoSelector onSelect={handleRepoSelect} />
            </div>
          )}

          {/* Formulário Manual */}
          {step === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {githubConnected && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurar Projeto</h3>
                  <button
                    type="button"
                    onClick={() => setStep('github')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    ← Voltar aos repositórios
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome do Projeto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="meu-projeto"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Apenas letras minúsculas, números e hífens</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome de Exibição</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Meu Projeto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">URL do Git</label>
                <input
                  type="url"
                  required
                  value={formData.gitUrl}
                  onChange={(e) => setFormData({ ...formData, gitUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://github.com/usuario/repo.git"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Branch</label>
                  {githubConnected && selectedRepo ? (
                    <>
                      <BranchSelector
                        owner={selectedRepo.owner}
                        repo={selectedRepo.repo}
                        token={githubToken}
                        value={formData.branch}
                        onChange={(branch) => setFormData({ ...formData, branch })}
                        defaultBranch={selectedRepo.defaultBranch}
                      />
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Carregando branches de {selectedRepo.owner}/{selectedRepo.repo}
                      </p>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        required
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="main"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {!githubConnected && 'Conecte ao GitHub para ver branches'}
                        {githubConnected && !selectedRepo && 'Selecione um repositório'}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="fullstack">Fullstack</option>
                  </select>
                </div>
              </div>

              {/* Seletor de Servidor */}
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <ServerIcon className="w-4 h-4" />
                  Servidor de Deploy
                </label>
                <select
                  value={formData.serverId}
                  onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">💻 Servidor Local (padrão)</option>
                  {servers.map((server) => (
                    <option key={server._id} value={server._id}>
                      🌐 {server.name} ({server.host})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.serverId 
                    ? '✓ Deploy será feito no servidor remoto via SSH' 
                    : 'Deploy será feito localmente neste servidor'}
                </p>
                {servers.length === 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Nenhum servidor remoto disponível. Adicione um na aba Servidores.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Porta (opcional)</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="3000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Domínio (opcional)</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="app.meusite.com ou deixe vazio"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.domain 
                      ? "Customizado" 
                      : "Será gerado: abc123xyz.localhost"
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Comando de Build</label>
                  <input
                    type="text"
                    value={formData.buildCommand}
                    onChange={(e) => setFormData({ ...formData, buildCommand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="npm run build"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Comando de Start</label>
                  <input
                    type="text"
                    value={formData.startCommand}
                    onChange={(e) => setFormData({ ...formData, startCommand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="npm start"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Variáveis de Ambiente</label>
                <textarea
                  value={formData.envVars}
                  onChange={(e) => setFormData({ ...formData, envVars: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  rows={4}
                  placeholder="NODE_ENV=production&#10;API_URL=https://api.example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
