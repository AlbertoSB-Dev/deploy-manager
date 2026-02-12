'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Network, Server, Clock, Package, Terminal, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface SystemMetrics {
  cpu: {
    count: number;
    model: string;
    speed: number;
    usage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    totalGB: number;
    freeGB: number;
    usedGB: number;
  };
  disk: Array<{
    filesystem: string;
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    totalGB: number;
    usedGB: number;
    freeGB: number;
  }>;
  network: Array<{
    interface: string;
    address: string;
    netmask: string;
    mac: string;
  }>;
  system: {
    platform: string;
    type: string;
    release: string;
    arch: string;
    hostname: string;
    nodeVersion: string;
  };
  uptime: {
    system: number;
    process: number;
    systemFormatted: string;
    processFormatted: string;
  };
  processes: any[];
  docker: {
    available: boolean;
    containers: any[];
    stats: any[];
  };
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadMetrics = async () => {
    try {
      const response = await api.get('/monitoring/metrics');
      setMetrics(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas do sistema');
      setLoading(false);
    }
  };

  const getStatusColor = (percent: number) => {
    if (percent < 60) return 'text-green-600 dark:text-green-400';
    if (percent < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (percent: number) => {
    if (percent < 60) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Carregando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Erro ao carregar métricas do sistema
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Monitoramento do Sistema
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Métricas em tempo real do servidor
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          )}

          <button
            onClick={loadMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">CPU</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.cpu.count} cores</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(metrics.cpu.usage)}`}>
              {metrics.cpu.usage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(metrics.cpu.usage)}`}
              style={{ width: `${metrics.cpu.usage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
            {metrics.cpu.model}
          </p>
        </div>

        {/* Memory */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Memória</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.memory.totalGB} GB</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(metrics.memory.usagePercent)}`}>
              {metrics.memory.usagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(metrics.memory.usagePercent)}`}
              style={{ width: `${metrics.memory.usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {metrics.memory.usedGB.toFixed(2)} GB / {metrics.memory.totalGB.toFixed(2)} GB
          </p>
        </div>

        {/* Disk */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Disco</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.disk[0]?.totalGB.toFixed(0)} GB</p>
              </div>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(metrics.disk[0]?.usagePercent || 0)}`}>
              {metrics.disk[0]?.usagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(metrics.disk[0]?.usagePercent || 0)}`}
              style={{ width: `${metrics.disk[0]?.usagePercent || 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {metrics.disk[0]?.freeGB.toFixed(2)} GB livres
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Uptime</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.uptime.systemFormatted}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Processo</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.uptime.processFormatted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações do Sistema
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Hostname:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.system.hostname}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Plataforma:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.system.platform} ({metrics.system.arch})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sistema:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.system.type} {metrics.system.release}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Node.js:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metrics.system.nodeVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Network className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Interfaces de Rede
            </h3>
          </div>
          <div className="space-y-3">
            {metrics.network.map((net, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {net.interface}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {net.address}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  MAC: {net.mac}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Docker Containers */}
      {metrics.docker.available && metrics.docker.containers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Containers Docker ({metrics.docker.containers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Imagem
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.docker.containers.map((container, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      {container.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {container.image}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                        {container.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {container.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Processes */}
      {metrics.processes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Processos (por memória)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    PID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    CPU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Memória
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Comando
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.processes.map((proc, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-mono">
                      {proc.pid}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {proc.user || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {proc.cpu || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {proc.memory || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 font-mono truncate max-w-md">
                      {proc.command || proc.name || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
