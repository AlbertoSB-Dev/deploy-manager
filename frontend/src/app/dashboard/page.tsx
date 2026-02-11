'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, RefreshCw, Moon, Sun, LogOut, User as UserIcon, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import GroupCard from '@/components/GroupCard';
import DashboardStats from '@/components/DashboardStats';
import { CreateProjectWithGitHub } from '@/components/CreateProjectWithGitHub';
import CreateGroupModal from '@/components/CreateGroupModal';
import EditGroupModal from '@/components/EditGroupModal';
import { AddServerModal } from '@/components/AddServerModal';
import CreateDatabaseModal from '@/components/CreateDatabaseModal';

export default function Dashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);
  const [wordpress, setWordpress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddServer, setShowAddServer] = useState(false);
  const [showCreateDatabase, setShowCreateDatabase] = useState(false);
  
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      loadAllData();
    }
  }, [authLoading, user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [groupsRes, serversRes, projectsRes, databasesRes] = await Promise.all([
        api.get('/groups').catch(() => ({ data: [] })),
        api.get('/servers').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/databases').catch(() => ({ data: [] })),
      ]);

      setGroups(groupsRes.data);
      setServers(serversRes.data);
      setProjects(projectsRes.data);
      setDatabases(databasesRes.data);
      // WordPress será carregado quando resolver o problema de importação
      setWordpress([]);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
  };

  const handleEditGroup = async (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      setEditingGroup(group);
      setShowEditGroup(true);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await api.delete(`/groups/${groupId}`);
      toast.success('Grupo excluído com sucesso!');
      loadAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir grupo');
    }
  };

  const handleMoveServer = async (serverId: string, targetGroupId: string) => {
    try {
      await api.put(`/servers/${serverId}`, { groupId: targetGroupId === 'ungrouped' ? null : targetGroupId });
      toast.success('Servidor movido com sucesso!');
      loadAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao mover servidor');
    }
  };

  // Criar grupo padrão se não existir
  const ungroupedServers = servers.filter(s => !s.groupId || !groups.find(g => g._id === s.groupId));
  const defaultGroup = {
    _id: 'ungrouped',
    name: 'Sem Grupo',
    description: 'Servidores não organizados em grupos',
  };

  const allGroups = [...groups];
  if (ungroupedServers.length > 0) {
    allGroups.push(defaultGroup);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/logo.png" alt="Ark Deploy" width={80} height={80} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Ark Deploy" width={40} height={40} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Ark Deploy</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Seu código, salvo da tempestade</p>
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
              <button
                onClick={loadAllData}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-xl transition shadow-sm border border-gray-200 dark:border-gray-600"
                title="Atualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-600"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white hidden md:block">
                    {user?.name}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      {user?.role === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                          Administrador
                        </span>
                      )}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <DashboardStats
          groupsCount={groups.length}
          projectsCount={projects.length}
          serversCount={servers.length}
          wordpressCount={wordpress.length}
          databasesCount={databases.length}
        />

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar grupos, servidores, projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-96 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Grupo</span>
            </button>
            <button
              onClick={() => setShowAddServer(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Servidor</span>
            </button>
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Projeto</span>
            </button>
            <button
              onClick={() => setShowCreateDatabase(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Banco</span>
            </button>
          </div>
        </div>

        {/* Groups */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
        ) : allGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6 flex justify-center">
              <Image src="/logo.png" alt="Ark Deploy" width={80} height={80} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Comece criando um grupo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Organize seus servidores e projetos em grupos
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl text-lg font-medium"
            >
              <Plus className="w-6 h-6" />
              <span>Criar Primeiro Grupo</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {allGroups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                servers={group._id === 'ungrouped' ? ungroupedServers : servers}
                projects={projects}
                databases={databases}
                wordpress={wordpress}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onDataUpdate={loadAllData}
                onMoveServer={handleMoveServer}
                allGroups={allGroups}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateProject && (
        <CreateProjectWithGitHub
          onClose={() => setShowCreateProject(false)}
          onSuccess={() => {
            setShowCreateProject(false);
            loadAllData();
          }}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={() => {
            setShowCreateGroup(false);
            loadAllData();
            toast.success('Grupo criado com sucesso!');
          }}
        />
      )}

      {showEditGroup && editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => {
            setShowEditGroup(false);
            setEditingGroup(null);
          }}
          onUpdated={() => {
            setShowEditGroup(false);
            setEditingGroup(null);
            loadAllData();
            toast.success('Grupo atualizado com sucesso!');
          }}
        />
      )}

      {showAddServer && (
        <AddServerModal
          onClose={() => setShowAddServer(false)}
          onSuccess={() => {
            setShowAddServer(false);
            loadAllData();
          }}
        />
      )}

      {showCreateDatabase && (
        <CreateDatabaseModal
          servers={servers}
          onClose={() => setShowCreateDatabase(false)}
          onSuccess={() => {
            setShowCreateDatabase(false);
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
