'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Shield, 
  Key, 
  Trash2, 
  Edit2, 
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Crown,
  Clock,
  Server,
  Database,
  Globe,
  User as UserIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stats, setStats] = useState({
    servers: 0,
    projects: 0,
    databases: 0,
  });

  const [newServersCount, setNewServersCount] = useState(1);
  const [changingServers, setChangingServers] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
      setNewServersCount(user.subscription?.serversCount || 1);
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [serversRes, projectsRes, databasesRes] = await Promise.all([
        api.get('/servers').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/databases').catch(() => ({ data: [] })),
      ]);

      setStats({
        servers: serversRes.data.length,
        projects: projectsRes.data.length,
        databases: databasesRes.data.length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await api.put('/auth/update-profile', profileData);
      toast.success('Perfil atualizado com sucesso!');
      setEditingProfile(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      setEditingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/payments/cancel-subscription');
      toast.success('Assinatura cancelada com sucesso');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao cancelar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeServers = async () => {
    if (newServersCount === (user?.subscription?.serversCount || 1)) {
      return;
    }

    const isUpgrade = newServersCount > (user?.subscription?.serversCount || 1);
    const message = isUpgrade
      ? `Confirmar upgrade para ${newServersCount} servidores? Você será cobrado proporcionalmente.`
      : `Confirmar downgrade para ${newServersCount} servidores? ${stats.servers > newServersCount ? `Você precisa deletar ${stats.servers - newServersCount} servidor(es) primeiro.` : 'O crédito será aplicado na próxima renovação.'}`;

    if (!confirm(message)) {
      return;
    }

    setChangingServers(true);
    try {
      const response = await api.post('/payments/change-servers', {
        newServersCount,
      });
      
      toast.success(response.data.message);
      
      // Mostrar detalhes da mudança
      if (response.data.data) {
        const { proportionalCharge, proportionalCredit, newPrice } = response.data.data;
        if (proportionalCharge > 0) {
          toast.success(`Cobrança proporcional: R$ ${proportionalCharge.toFixed(2)}`);
        }
        if (proportionalCredit > 0) {
          toast.success(`Crédito na próxima renovação: R$ ${proportionalCredit.toFixed(2)}`);
        }
        toast.success(`Novo valor mensal: R$ ${newPrice.toFixed(2)}`);
      }
      
      // Recarregar página para atualizar dados
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao alterar quantidade de servidores');
      setNewServersCount(user?.subscription?.serversCount || 1);
    } finally {
      setChangingServers(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setLoading(true);
    try {
      await api.post('/auth/delete-account', { password });
      toast.success('Conta deletada com sucesso');
      logout();
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao deletar conta');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!user?.subscription) return { text: 'Sem plano', color: 'gray', icon: <X className="w-5 h-5" /> };
    
    const status = user.subscription.status;
    
    if (status === 'trial') {
      return { 
        text: 'Trial Ativo', 
        color: 'blue',
        icon: <Clock className="w-5 h-5" />
      };
    } else if (status === 'active') {
      return { 
        text: 'Assinatura Ativa', 
        color: 'green',
        icon: <CheckCircle className="w-5 h-5" />
      };
    } else if (status === 'cancelled') {
      return { 
        text: 'Cancelada', 
        color: 'red',
        icon: <X className="w-5 h-5" />
      };
    } else if (status === 'inactive') {
      return { 
        text: 'Expirada', 
        color: 'orange',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    }
    
    return { text: 'Desconhecido', color: 'gray', icon: <X className="w-5 h-5" /> };
  };

  const getDaysRemaining = () => {
    if (!user?.subscription?.endDate) return 0;
    const end = new Date(user.subscription.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie suas informações pessoais e assinatura
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Perfil */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </h2>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Função</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card de Segurança */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Segurança
                </h2>
                {!editingPassword && (
                  <button
                    onClick={() => setEditingPassword(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Alterar Senha
                  </button>
                )}
              </div>

              {editingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Mantenha sua conta segura alterando sua senha regularmente.
                </p>
              )}
            </div>

            {/* Zona de Perigo */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-6">
              <h2 className="text-xl font-bold text-red-900 dark:text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                Zona de Perigo
              </h2>
              <p className="text-red-800 dark:text-red-400 mb-4 text-sm">
                Ações irreversíveis que afetam permanentemente sua conta.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                Deletar Conta
              </button>
            </div>
          </div>

          {/* Coluna Direita - Assinatura e Recursos */}
          <div className="space-y-6">
            {/* Card de Assinatura */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5" />
                Assinatura
              </h2>

              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 bg-${subscriptionStatus.color}-50 dark:bg-${subscriptionStatus.color}-900/20 rounded-lg border border-${subscriptionStatus.color}-200 dark:border-${subscriptionStatus.color}-700`}>
                  {subscriptionStatus.icon}
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                    <p className={`font-bold text-${subscriptionStatus.color}-700 dark:text-${subscriptionStatus.color}-400`}>
                      {subscriptionStatus.text}
                    </p>
                  </div>
                </div>

                {user.subscription?.planId && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Plano</p>
                      <p className="font-bold text-purple-700 dark:text-purple-400">
                        {user.subscription.planId.name || 'Plano Personalizado'}
                      </p>
                    </div>
                  </div>
                )}

                {user.subscription?.serversCount && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Limite de Servidores</p>
                      <p className="font-bold text-blue-700 dark:text-blue-400">
                        {user.subscription.serversCount} servidor(es)
                      </p>
                    </div>
                  </div>
                )}

                {daysRemaining > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Dias Restantes</p>
                      <p className="font-bold text-gray-900 dark:text-white">{daysRemaining} dias</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => router.push('/billing')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  Ver Histórico de Pagamentos
                </button>

                {user.subscription?.status === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition border border-red-200 dark:border-red-800 disabled:opacity-50 text-sm font-medium"
                  >
                    Cancelar Assinatura
                  </button>
                )}

                {(user.subscription?.status === 'trial' || user.subscription?.status === 'inactive') && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md flex items-center justify-center gap-2 font-medium"
                  >
                    <Crown className="w-4 h-4" />
                    Fazer Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Card de Gerenciamento de Servidores */}
            {user.subscription?.status === 'active' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <Server className="w-5 h-5" />
                  Gerenciar Servidores
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                      Quantidade de Servidores
                    </label>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setNewServersCount(Math.max(1, newServersCount - 1))}
                        disabled={changingServers || newServersCount <= 1}
                        className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold text-gray-700 dark:text-gray-300"
                      >
                        −
                      </button>
                      <span className="text-3xl font-bold text-gray-900 dark:text-white min-w-[50px] text-center">
                        {newServersCount}
                      </span>
                      <button
                        onClick={() => setNewServersCount(newServersCount + 1)}
                        disabled={changingServers}
                        className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold text-gray-700 dark:text-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Atual: {user.subscription.serversCount || 1} servidor(es)
                    </p>
                  </div>

                  {newServersCount !== (user.subscription.serversCount || 1) && (
                    <div className={`${newServersCount > (user.subscription.serversCount || 1) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'} border rounded-lg p-3`}>
                      <h3 className={`font-semibold mb-1 text-sm ${newServersCount > (user.subscription.serversCount || 1) ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'}`}>
                        {newServersCount > (user.subscription.serversCount || 1) ? '⬆️ Upgrade' : '⬇️ Downgrade'}
                      </h3>
                      <p className={`text-xs ${newServersCount > (user.subscription.serversCount || 1) ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                        {newServersCount > (user.subscription.serversCount || 1) 
                          ? 'Você será cobrado proporcionalmente pelos dias restantes'
                          : stats.servers > newServersCount
                            ? `⚠️ Delete ${stats.servers - newServersCount} servidor(es) antes de fazer downgrade`
                            : 'O crédito será aplicado na próxima renovação'
                        }
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleChangeServers}
                    disabled={newServersCount === (user.subscription.serversCount || 1) || changingServers || (newServersCount < (user.subscription.serversCount || 1) && stats.servers > newServersCount)}
                    className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md text-sm"
                  >
                    {changingServers ? 'Processando...' : 'Confirmar Mudança'}
                  </button>
                </div>
              </div>
            )}

            {/* Card de Uso de Recursos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Uso de Recursos
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-900 dark:text-white font-medium text-sm">Servidores</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.servers}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-900 dark:text-white font-medium text-sm">Projetos</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.projects}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-900 dark:text-white font-medium text-sm">Bancos de Dados</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.databases}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Deletar Conta */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={loading}
        />
      )}
    </div>
  );
}

// Modal de Confirmação de Deleção
function DeleteAccountModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: (password: string) => void; loading: boolean }) {
  const [password, setPassword] = useState('');

  const handleConfirm = async () => {
    if (!password) {
      toast.error('Digite sua senha para confirmar');
      return;
    }

    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Confirmar Deleção de Conta
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Esta ação é irreversível. Digite sua senha para confirmar.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Deletando...' : 'Deletar Conta'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
