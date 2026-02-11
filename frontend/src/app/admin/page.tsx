'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Users, TrendingUp, Server, Database, Package, Activity } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  monthlyGrowth: { month: number; count: number }[];
  subscriptionStats: { _id: string; count: number }[];
  totalProjects: number;
  totalServers: number;
  totalDatabases: number;
  popularPlans: { planName: string; count: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      loadStats();
    }
  }, [user, authLoading, router]);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Super Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Visão geral do sistema
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/panel-deploy"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Deploy do Painel
              </Link>
              <Link
                href="/admin/settings"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Configurações
              </Link>
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Gerenciar Usuários
              </Link>
              <Link
                href="/admin/plans"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Gerenciar Planos
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Usuários Ativos"
            value={stats.activeUsers}
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Novos Este Mês"
            value={stats.newUsersThisMonth}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Total de Projetos"
            value={stats.totalProjects}
            icon={<Package className="w-6 h-6" />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Crescimento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Crescimento de Usuários ({new Date().getFullYear()})
            </h3>
            <div className="space-y-3">
              {stats.monthlyGrowth.map((data) => (
                <div key={data.month} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                    {monthNames[data.month - 1]}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max((data.count / Math.max(...stats.monthlyGrowth.map(m => m.count))) * 100, 5)}%`
                      }}
                    >
                      {data.count > 0 && (
                        <span className="text-xs font-medium text-white">{data.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status de Assinaturas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status de Assinaturas
            </h3>
            <div className="space-y-4">
              {stats.subscriptionStats.map((stat) => (
                <div key={stat._id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(stat._id)}`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {getStatusLabel(stat._id)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recursos do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ResourceCard
            title="Servidores"
            value={stats.totalServers}
            icon={<Server className="w-8 h-8" />}
            color="blue"
          />
          <ResourceCard
            title="Bancos de Dados"
            value={stats.totalDatabases}
            icon={<Database className="w-8 h-8" />}
            color="green"
          />
          <ResourceCard
            title="Projetos"
            value={stats.totalProjects}
            icon={<Package className="w-8 h-8" />}
            color="purple"
          />
        </div>

        {/* Planos Mais Populares */}
        {stats.popularPlans.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Planos Mais Populares
            </h3>
            <div className="space-y-3">
              {stats.popularPlans.map((plan, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.planName}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.count} usuário{plan.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ title, value, icon, color }: any) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-lg shadow p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    inactive: 'bg-gray-500',
    cancelled: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    trial: 'Trial',
    inactive: 'Inativo',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}
