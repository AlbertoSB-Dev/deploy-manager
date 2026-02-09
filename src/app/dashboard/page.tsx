'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Rocket, Activity, TrendingUp, Moon, Sun, Server, FolderPlus, LogOut, User as UserIcon, Terminal } from 'lucide-react';
import { api } from '@/lib/api';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectWithGitHub } from '@/components/CreateProjectWithGitHub';
import { ServerList } from '@/components/ServerList';
import DatabaseList from '@/components/DatabaseList';
import ProjectGroupView from '@/components/ProjectGroupView';
import CreateGroupModal from '@/components/CreateGroupModal';
import TerminalSSH from '@/components/TerminalSSH';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'groups'>('groups');
  const [activeTab, setActiveTab] = useState<'projects' | 'servers' | 'databases' | 'terminal'>('projects');
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();

  const loadProjects = async () => {
    try {
      // Verificar se tem token antes de fazer a requisição
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ Token não encontrado, não é possível carregar projetos');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      // Verificar se tem token antes de fazer a requisição
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ Token não encontrado, não é possível carregar grupos');
        setGroups([]);
        return;
      }
      
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error);
      // Se der erro, inicializar com array vazio
      setGroups([]);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
      loadGroups();
    }
  }, [authLoading, user]);

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleDataUpdate = () => {
    loadProjects();
    loadGroups();
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4 animate-pulse">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    withUpdates: projects.filter(p => p.hasUpdate).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Deploy Manager</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Gerencie seus deploys com facilidade</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-xl transition shadow-sm border border-gray-200 dark:border-gray-600"
                title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {activeTab === 'projects' && (
                <>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'groups' : 'grid')}
                    className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-xl transition shadow-sm border border-gray-200 dark:border-gray-600"
                    title={viewMode === 'grid' ? 'Ver por Grupos' : 'Ver em Grade'}
                  >
                    {viewMode === 'grid' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={loadProjects}
                    className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-xl transition shadow-sm border border-gray-200 dark:border-gray-600"
                    title="Atualizar"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-600"
                >
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white hidden md:block">
                    {user?.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                        {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </div>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Painel Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Rocket className="w-4 h-4" />
              Projetos
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'servers'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Server className="w-4 h-4" />
              Servidores
            </button>
            <button
              onClick={() => setActiveTab('databases')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'databases'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Bancos de Dados
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'terminal'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Terminal
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {!loading && projects.length > 0 && activeTab === 'projects' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total de Projetos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.total}</p>
                </div>
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">{stats.active}</p>
                </div>
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Atualizações Disponíveis</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{stats.withUpdates}</p>
                </div>
                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'projects' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Carregando projetos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-3xl mb-6">
                <Rocket className="w-20 h-20 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Nenhum projeto ainda</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Comece criando seu primeiro projeto e faça deploys com facilidade</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-lg font-medium"
              >
                <Plus className="w-6 h-6" />
                <span>Criar Primeiro Projeto</span>
              </button>
            </div>
          ) : (
            <>
              {/* Barra de Ações */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewMode === 'grid' ? 'Todos os Projetos' : 'Projetos por Grupo'}
                  </h2>
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                    {projects.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition shadow-sm"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span className="font-medium">Novo Grupo</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Novo Projeto</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo dos Projetos */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map((project) => (
                    <ProjectCard key={project._id} project={project} onUpdate={handleDataUpdate} />
                  ))}
                </div>
              ) : (
                <ProjectGroupView
                  projects={projects}
                  groups={groups}
                  onProjectUpdated={handleDataUpdate}
                />
              )}
            </>
          )
        ) : activeTab === 'servers' ? (
          <ServerList />
        ) : activeTab === 'databases' ? (
          <DatabaseList />
        ) : (
          <TerminalSSH />
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectWithGitHub
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreated={() => {
            setShowCreateGroupModal(false);
            handleDataUpdate();
            toast.success('Grupo criado com sucesso!');
          }}
        />
      )}
    </div>
  );
}
