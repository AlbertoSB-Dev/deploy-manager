'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Cpu, HardDrive, Activity, Network, Clock, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  totalMemory: string;
  usedMemory: string;
  totalDisk: string;
  usedDisk: string;
  uptime: string;
  loadAverage: {
    '1min': number;
    '5min': number;
    '15min': number;
  };
  network: {
    received: string;
    transmitted: string;
  };
  topProcesses: Array<{
    name: string;
    cpu: number;
    memory: number;
  }>;
  dockerContainers: Array<{
    name: string;
    cpu: string;
    memory: string;
  }>;
}

interface Props {
  serverId: string;
  serverName: string;
  onClose: () => void;
}

export function ServerMonitorModal({ serverId, serverName, onClose }: Props) {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh a cada 5 segundos
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadMetrics();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [serverId, autoRefresh]);

  const loadMetrics = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/metrics`);
      setMetrics(response.data);
    } catch (error: any) {
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const getColorByPercentage = (value: number) => {
    if (value < 50) return 'text-green-600 dark:text-green-400';
    if (value < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColorByPercentage = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Monitoramento do Servidor
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {serverName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                autoRefresh
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </span>
            </button>
            <button
              onClick={loadMetrics}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {loading && !metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : metrics ? (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CPU */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Cpu className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">CPU</p>
                        <p className={`text-3xl font-bold ${getColorByPercentage(metrics.cpu)}`}>
                          {metrics.cpu}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getBarColorByPercentage(metrics.cpu)}`}
                      style={{ width: `${metrics.cpu}%` }}
                    ></div>
                  </div>
                </div>

                {/* Memory */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Memória RAM</p>
                        <p className={`text-3xl font-bold ${getColorByPercentage(metrics.memory)}`}>
                          {metrics.memory}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all ${getBarColorByPercentage(metrics.memory)}`}
                      style={{ width: `${metrics.memory}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {metrics.usedMemory} / {metrics.totalMemory}
                  </p>
                </div>

                {/* Disk */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <HardDrive className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Disco</p>
                        <p className={`text-3xl font-bold ${getColorByPercentage(metrics.disk)}`}>
                          {metrics.disk}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all ${getBarColorByPercentage(metrics.disk)}`}
                      style={{ width: `${metrics.disk}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {metrics.usedDisk} / {metrics.totalDisk}
                  </p>
                </div>
              </div>

              {/* Informações do Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Uptime e Load */}
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Sistema
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.uptime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Load Average</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {metrics.loadAverage['1min'].toFixed(2)} / {metrics.loadAverage['5min'].toFixed(2)} / {metrics.loadAverage['15min'].toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">1min / 5min / 15min</p>
                    </div>
                  </div>
                </div>

                {/* Network */}
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Rede (Total)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">⬇️ Recebido</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {metrics.network.received}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">⬆️ Transmitido</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {metrics.network.transmitted}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Processes */}
              {metrics.topProcesses.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Processos (CPU)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Processo</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">CPU %</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">RAM %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.topProcesses.map((proc, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-600">
                            <td className="py-2 text-gray-900 dark:text-white font-mono text-xs">
                              {proc.name}
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">
                              {proc.cpu.toFixed(1)}%
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">
                              {proc.memory.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Docker Containers */}
              {metrics.dockerContainers.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    🐳 Containers Docker
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Container</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">CPU</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Memória</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.dockerContainers.map((container, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-600">
                            <td className="py-2 text-gray-900 dark:text-white font-mono text-xs">
                              {container.name}
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">
                              {container.cpu}
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">
                              {container.memory}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Erro ao carregar métricas do servidor
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
