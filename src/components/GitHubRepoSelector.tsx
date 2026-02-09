'use client';

import { useState, useEffect } from 'react';
import { Search, GitBranch, Lock, Globe } from 'lucide-react';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  language: string;
  updatedAt: string;
  owner: {
    login: string;
    avatar: string;
  };
}

interface GitHubRepoSelectorProps {
  onSelect: (repo: GitHubRepo) => void;
}

export default function GitHubRepoSelector({ onSelect }: GitHubRepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRepos();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.description?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [search, repos]);

  const loadRepos = async () => {
    // Buscar token da conta ativa do GitHubAccountManager
    const { GitHubAccountManager } = await import('@/lib/githubAccounts');
    const activeAccount = GitHubAccountManager.getActiveAccount();
    
    if (!activeAccount) {
      console.log('⚠️ Nenhuma conta GitHub conectada');
      setLoading(false);
      return;
    }

    const token = activeAccount.token;
    console.log('🔑 Usando token da conta:', activeAccount.username);

    try {
      console.log('📡 Buscando repositórios do GitHub...');
      
      // Buscar diretamente da API do GitHub
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const githubRepos = await response.json();
      console.log(`✅ ${githubRepos.length} repositórios encontrados`);

      // Mapear para o formato esperado
      const mappedRepos: GitHubRepo[] = githubRepos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        updatedAt: repo.updated_at,
        owner: {
          login: repo.owner.login,
          avatar: repo.owner.avatar_url,
        },
      }));

      setRepos(mappedRepos);
      setFilteredRepos(mappedRepos);
    } catch (error) {
      console.error('❌ Erro ao carregar repositórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar repositórios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Lista de Repositórios */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {search ? 'Nenhum repositório encontrado' : 'Nenhum repositório disponível'}
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelect(repo)}
              className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <img
                  src={repo.owner.avatar}
                  alt={repo.owner.login}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {repo.fullName}
                    </h3>
                    {repo.private ? (
                      <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {repo.defaultBranch}
                    </span>
                    <span>Atualizado em {formatDate(repo.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
