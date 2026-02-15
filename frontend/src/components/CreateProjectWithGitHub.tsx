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

interface DockerfileTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack';
}

export function CreateProjectWithGitHub({ onClose, onSuccess }: CreateProjectWithGitHubProps) {
  const [step, setStep] = useState<'method' | 'github' | 'manual' | 'wordpress'>('method');
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; defaultBranch: string } | null>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<DockerfileTemplate[]>([]);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templatePreview, setTemplatePreview] = useState('');
  
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
    serverId: '', // Novo campo
    dockerfileTemplate: '' // Novo campo para template
  });
  const [creating, setCreating] = useState(false);

  // Carregar servidores disponíveis
  useEffect(() => {
    loadServers();
    loadTemplates();
  }, []);

  const loadServers = async () => {
    try {
      console.log('🔍 Carregando servidores...');
      const response = await api.get('/servers');
      console.log('📦 Servidores recebidos:', response.data);
      console.log('📊 Total de servidores:', response.data.length);
      // Mostrar todos os servidores do usuário, independente do status
      setServers(response.data);
    } catch (error) {
      console.error('❌ Erro ao carregar servidores:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/projects/dockerfile-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
    }
  };

  const handlePreviewTemplate = async (templateId: string) => {
    try {
      const response = await api.get(`/projects/dockerfile-templates/${templateId}`);
      setTemplatePreview(response.data.content);
      setShowTemplatePreview(true);
    } catch (error) {
      console.error('❌ Erro ao carregar preview:', error);
      toast.error('Erro ao carregar preview do template');
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
        serverName: selectedServer?.name || undefined,
        dockerfileTemplate: formData.dockerfileTemplate || undefined
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

              {/* Opção WordPress */}
              <button
                onClick={() => setStep('wordpress')}
                className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Instalar WordPress</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Instale WordPress com um clique, incluindo banco de dados MySQL
                    </p>
                  </div>
                </div>
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione um servidor</option>
                  {servers.map((server) => (
                    <option key={server._id} value={server._id}>
                      🌐 {server.name} ({server.host})
                    </option>
                  ))}
                </select>
                {formData.serverId ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Deploy será feito no servidor selecionado via SSH
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Escolha o servidor onde o projeto será hospedado
                  </p>
                )}
                {servers.length === 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Nenhum servidor disponível. Adicione um na aba Servidores primeiro.
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

              {/* Seletor de Template de Dockerfile */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Dockerfile
                </label>
                <div className="space-y-3">
                  {/* Opção: Usar próprio Dockerfile */}
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <input
                      type="radio"
                      name="dockerfileOption"
                      value=""
                      checked={formData.dockerfileTemplate === ''}
                      onChange={() => setFormData({ ...formData, dockerfileTemplate: '' })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Usar Dockerfile do Repositório</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Se o projeto já tem um Dockerfile, ele será usado automaticamente
                      </div>
                    </div>
                  </label>

                  {/* Opção: Usar template do painel */}
                  <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="dockerfileOption"
                        value="template"
                        checked={formData.dockerfileTemplate !== ''}
                        onChange={() => {
                          // Se não tem template selecionado, selecionar o primeiro
                          if (!formData.dockerfileTemplate && templates.length > 0) {
                            setFormData({ ...formData, dockerfileTemplate: templates[0].id });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">Usar Template do Painel</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Escolha um template otimizado para seu tipo de projeto
                        </div>
                        
                        {formData.dockerfileTemplate !== '' && (
                          <select
                            value={formData.dockerfileTemplate}
                            onChange={(e) => setFormData({ ...formData, dockerfileTemplate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                          >
                            <option value="">Detecção Automática</option>
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} - {template.description}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {formData.dockerfileTemplate && formData.dockerfileTemplate !== '' && (
                          <button
                            type="button"
                            onClick={() => handlePreviewTemplate(formData.dockerfileTemplate)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            👁️ Ver conteúdo do template
                          </button>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Se o repositório não tiver Dockerfile, o template selecionado será usado automaticamente
                </p>
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

          {/* Formulário WordPress */}
          {step === 'wordpress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Instalar WordPress</h3>
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  ← Voltar
                </button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  O WordPress será instalado com MySQL e configurado automaticamente com Traefik para acesso via domínio.
                </p>
              </div>

              <div className="text-center py-8">
                <div className="inline-flex p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl mb-4">
                  <svg className="w-16 h-16 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0z"/>
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  A instalação do WordPress será feita na aba "WordPress" do dashboard.<br/>
                  Clique no botão abaixo para ir direto para lá.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Trigger para mudar para aba WordPress (será implementado)
                    toast.success('Vá para a aba WordPress para instalar');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0z"/>
                  </svg>
                  Ir para Instalação WordPress
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Preview do Template */}
      {showTemplatePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preview do Dockerfile</h3>
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {templatePreview}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
