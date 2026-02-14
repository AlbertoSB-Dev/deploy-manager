'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Terminal } from 'lucide-react';
import LiveLogsViewer from '@/components/LiveLogsViewer';
import { api } from '@/lib/api';

export default function ProjectLogsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Terminal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Projeto não encontrado
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Logs do Projeto
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {project.displayName || project.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'running'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : project.status === 'stopped'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {project.status === 'running' ? '🟢 Online' : 
                 project.status === 'stopped' ? '⚫ Parado' : '🔴 Erro'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <LiveLogsViewer 
            projectId={projectId} 
            projectName={project.displayName || project.name}
          />
        </div>
      </div>
    </div>
  );
}
