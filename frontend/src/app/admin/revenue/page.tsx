'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  UserPlus, 
  UserMinus,
  Percent,
  Crown,
  Calendar,
  Server,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface RevenueData {
  summary: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    activeSubscribers: number;
    totalSubscribers: number;
    newSubscribersThisMonth: number;
    cancelledThisMonth: number;
    churnRate: string;
    averageRevenuePerUser: string;
  };
  revenueByPlan: Array<{
    planName: string;
    subscribers: number;
    revenue: number;
  }>;
  monthlyRevenueHistory: Array<{
    month: string;
    revenue: number;
  }>;
  statusDistribution: {
    active: number;
    trial: number;
    cancelled: number;
    inactive: number;
  };
  topCustomers: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    serversCount: number;
    monthlyRevenue: number;
    startDate: string;
  }>;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/revenue');
      setData(res.data.data);
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Receita & Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão completa das métricas financeiras
          </p>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>MRR</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Receita Mensal</p>
            <p className="text-3xl font-bold">{formatCurrency(data.summary.monthlyRevenue)}</p>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>ARR</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Receita Anual</p>
            <p className="text-3xl font-bold">{formatCurrency(data.summary.yearlyRevenue)}</p>
          </div>
        </div>

        {/* Assinantes Ativos */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <ArrowUp className="w-4 h-4" />
              <span>+{data.summary.newSubscribersThisMonth}</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Assinantes Ativos</p>
            <p className="text-3xl font-bold">{data.summary.activeSubscribers}</p>
          </div>
        </div>

        {/* ARPU */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <Percent className="w-4 h-4" />
              <span>ARPU</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Receita Média/Usuário</p>
            <p className="text-3xl font-bold">{formatCurrency(parseFloat(data.summary.averageRevenuePerUser))}</p>
          </div>
        </div>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Novos Assinantes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Novos Este Mês</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.summary.newSubscribersThisMonth}
              </p>
            </div>
          </div>
        </div>

        {/* Cancelamentos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <UserMinus className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cancelamentos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.summary.cancelledThisMonth}
              </p>
            </div>
          </div>
        </div>

        {/* Taxa de Churn */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Churn</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.summary.churnRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receita por Plano */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Receita por Plano
        </h2>
        <div className="space-y-4">
          {data.revenueByPlan.map((plan, index) => {
            const percentage = (plan.revenue / data.summary.monthlyRevenue) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{plan.planName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.subscribers} assinante{plan.subscribers !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(plan.revenue)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Top 10 Clientes por Receita
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servidores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Receita Mensal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente Desde
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.topCustomers.map((customer, index) => (
                <tr key={customer.userId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.userName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.userEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.planName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {customer.serversCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(customer.monthlyRevenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(customer.startDate).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribuição de Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Distribuição de Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.statusDistribution.active}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ativas</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.statusDistribution.trial}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Trial</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {data.statusDistribution.cancelled}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Canceladas</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {data.statusDistribution.inactive}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Inativas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
