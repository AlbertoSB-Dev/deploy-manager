'use client';

export const dynamic = 'force-dynamic';

import PanelDeployManager from '@/components/PanelDeployManager';

export default function PanelDeployPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Deploy do Painel
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Gerencie versões e faça deploy do painel administrativo
        </p>
      </div>
      <PanelDeployManager />
    </div>
  );
}
