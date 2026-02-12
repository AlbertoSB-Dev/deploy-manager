'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  TrendingUp, 
  Server, 
  Database, 
  Package, 
  Activity,
  Settings,
  Rocket,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  DollarSign,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
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
  revenueStats?: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    growthRate: number;
  };
  recentActivity?: Array<{
    type: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {greeting}, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Aqui está um resumo do seu painel administrativo
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-blue-100">Usuários</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeUsers}</div>
                <div className="text-sm text-blue-100">Ativos</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
                <div className="text-sm text-blue-100">Projetos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Usuários"
              value={stats.totalUsers}
              icon={Users}
              trend="+12%"
              trendUp={true}
              color="blue"
              subtitle="vs. mês anterior"
            />
            <MetricCard
              title="Usuários Ativos"
              value={stats.activeUsers}
              icon={Activity}
              trend="+8%"
              trendUp={true}
              color="green"
              subtitle="com assinatura ativa"
            />
            <MetricCard
              title="Novos Este Mês"
              value={stats.newUsersThisMonth}
              icon={UserPlus}
              trend="+23%"
              trendUp={true}
              color="purple"
              subtitle="novos cadastros"
            />
            <MetricCard
              title="Total de Projetos"
              value={stats.totalProjects}
              icon={Package}
              trend="+15%"
              trendUp={true}
              color="orange"
              subtitle="projetos ativos"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Chart */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Crescimento de Usuários
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Evolução mensal de cadastros
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  {new Date().getFullYear()}
                </span>
              </div>
              <LineChart data={stats.monthlyGrowth} monthNames={monthNames} />
            </div>

            {/* Subscription Status */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Status de Assinaturas
              </h3>
              <div className="space-y-4">
                {stats.subscriptionStats.map((stat) => (
                  <div key={stat._id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(stat._id)} shadow-lg ring-4 ring-white dark:ring-gray-800`}></div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize block">
                          {getStatusLabel(stat._id)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {((stat.count / stats.totalUsers) * 100).toFixed(1)}% do total
                        </span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resources and Popular Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Resources */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Recursos do Sistema
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <ResourceCard
                  title="Servidores"
                  value={stats.totalServers}
                  icon={Server}
                  gradient="from-blue-500 via-blue-600 to-indigo-600"
                />
                <ResourceCard
                  title="Bancos"
                  value={stats.totalDatabases}
                  icon={Database}
                  gradient="from-green-500 via-green-600 to-emerald-600"
                />
                <ResourceCard
                  title="Projetos"
                  value={stats.totalProjects}
                  icon={Package}
                  gradient="from-purple-500 via-purple-600 to-indigo-600"
                />
              </div>
            </div>

            {/* Popular Plans */}
            {stats.popularPlans.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Planos Mais Populares
                </h3>
                <div className="space-y-3">
                  {stats.popularPlans.slice(0, 3).map((plan, index) => (
                    <div
                      key={index}
                      className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all group"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            'bg-gradient-to-br from-orange-400 to-red-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block">
                              {plan.planName}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {plan.count} usuário{plan.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {plan.count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, trend, trendUp, color, subtitle }: any) {
  const colors = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      ring: 'ring-green-500/20'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      ring: 'ring-purple-500/20'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      ring: 'ring-orange-500/20'
    },
  };

  const colorScheme = colors[color as keyof typeof colors];

  return (
    <div className={`relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all group ring-1 ${colorScheme.ring}`}>
      {/* Background Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorScheme.bg} opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`${colorScheme.light} p-3 rounded-xl ring-4 ring-white dark:ring-gray-800 shadow-lg`}>
            <Icon className={`w-6 h-6 ${colorScheme.text}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trendUp 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                : 'text-red-600 bg-red-50 dark:bg-red-900/20'
            }`}>
              {trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Line Chart Component
function LineChart({ data, monthNames }: { data: { month: number; count: number }[], monthNames: string[] }) {
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 220;
  const padding = 30;
  
  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - ((d.count / maxValue) * (chartHeight - padding * 2)) - padding;
    return { x, y, count: d.count, month: d.month };
  });
  
  const createSmoothPath = (pts: Array<{ x: number; y: number; count: number; month: number }>) => {
    if (pts.length < 2) return '';
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;
  
  return (
    <div className="relative">
      <div className="absolute inset-0 flex flex-col justify-between py-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700/50"></div>
        ))}
      </div>
      
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg viewBox={`0 0 100 ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="rgb(99, 102, 241)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" />
              <stop offset="50%" stopColor="rgb(99, 102, 241)" />
              <stop offset="100%" stopColor="rgb(139, 92, 246)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-700 ease-out" />
          <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" className="transition-all duration-700 ease-out" />
        </svg>
        
        <div className="absolute inset-0">
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${point.x}%`, top: `${point.y}px` }}
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <div className="absolute inset-0 w-8 h-8 -m-4 rounded-full bg-blue-500/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              <div className="relative w-3 h-3 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-lg group-hover:scale-150 transition-all duration-300">
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75 group-hover:opacity-100"></div>
              </div>
              
              {hoveredPoint === index && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-10">
                  <div className="text-center">
                    <div className="text-gray-300 dark:text-gray-400">{monthNames[point.month - 1]}</div>
                    <div className="text-lg">{point.count} usuários</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-6 px-1">
        {data.map((d) => (
          <div key={d.month} className={`flex flex-col items-center transition-all duration-300 ${
            hoveredPoint !== null && data[hoveredPoint]?.month === d.month ? 'scale-110' : 'opacity-60 hover:opacity-100'
          }`}>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{monthNames[d.month - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Resource Card Component
function ResourceCard({ title, value, icon: Icon, gradient }: any) {
  return (
    <div className="relative overflow-hidden group">
      <div className={`relative bg-gradient-to-br ${gradient} rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all`}>
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative text-white">
          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg w-fit mb-3">
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-xs opacity-90 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    inactive: 'bg-gray-400',
    cancelled: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-400';
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
