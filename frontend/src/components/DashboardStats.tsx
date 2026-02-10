'use client';

import { Rocket, Server, Database, Globe } from 'lucide-react';

interface DashboardStatsProps {
  groupsCount: number;
  projectsCount: number;
  serversCount: number;
  wordpressCount: number;
  databasesCount: number;
}

export default function DashboardStats({
  groupsCount,
  projectsCount,
  serversCount,
  wordpressCount,
  databasesCount,
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Grupos',
      value: groupsCount,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      label: 'Projetos',
      value: projectsCount,
      icon: <Rocket className="w-6 h-6" />,
      color: 'purple',
    },
    {
      label: 'Servidores',
      value: serversCount,
      icon: <Server className="w-6 h-6" />,
      color: 'green',
    },
    {
      label: 'Bancos de Dados',
      value: databasesCount,
      icon: <Database className="w-6 h-6" />,
      color: 'orange',
    },
    {
      label: 'WordPress',
      value: wordpressCount,
      icon: <Globe className="w-6 h-6" />,
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-900/30',
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color);
        return (
          <div
            key={stat.label}
            className={`${colors.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 ${colors.iconBg} rounded-lg ${colors.text}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
