'use client';

import { useState } from 'react';
import CredentialsModal from '@/components/CredentialsModal';

interface Database {
  _id: string;
  name: string;
  displayName: string;
  type: 'mongodb' | 'mysql' | 'mariadb' | 'postgresql' | 'redis' | 'minio';
  version: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  containerId: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  serverId: string;
  serverName: string;
  connectionString: string;
  volumePath: string;
  // Campos específicos do MinIO
  consolePort?: number;
  accessKey?: string;
  secretKey?: string;
  consoleUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseCardProps {
  database: Database;
  onDeleted: () => void;
}

const DATABASE_ICONS = {
  mongodb: '🍃',
  mysql: '🐬',
  mariadb: '🦭',
  postgresql: '🐘',
  redis: '🔴',
  minio: '📦'
};

const DATABASE_NAMES = {
  mongodb: 'MongoDB',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  minio: 'MinIO'
};

export default function DatabaseCard({ database, onDeleted }: DatabaseCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:8001/api/databases/${database._id}/start`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao iniciar banco:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:8001/api/databases/${database._id}/stop`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao parar banco:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:8001/api/databases/${database._id}/restart`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (error) {
      console.error('Erro ao reiniciar banco:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar o banco "${database.displayName}"?\n\n⚠️ ATENÇÃO: Todos os dados serão perdidos permanentemente!`)) {
      return;
    }

    setLoading(true);
    try {
      await fetch(`http://localhost:8001/api/databases/${database._id}`, {
        method: 'DELETE',
      });
      onDeleted();
    } catch (error) {
      console.error('Erro ao deletar banco:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (database.status) {
      case 'running':
        return 'text-green-600 dark:text-green-400';
      case 'stopped':
        return 'text-gray-600 dark:text-gray-400';
      case 'creating':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (database.status) {
      case 'running':
        return 'Rodando';
      case 'stopped':
        return 'Parado';
      case 'creating':
        return 'Criando';
      case 'error':
        return 'Erro';
      default:
        return database.status;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Ícone */}
            <div className="text-4xl">{DATABASE_ICONS[database.type]}</div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {DATABASE_NAMES[database.type]}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  v{database.version}
                </span>
                <span className={`flex items-center gap-1 text-sm font-medium ${getStatusColor()}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {getStatusText()}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {database.displayName}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  {database.serverName}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {database.host}:{database.port}
                </span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCredentials(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              title="Ver Credenciais"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>

            {database.status === 'running' ? (
              <>
                <button
                  onClick={handleRestart}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  title="Reiniciar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  title="Parar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={handleStart}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                title="Iniciar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              title="Deletar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showCredentials && (
        <CredentialsModal
          database={database}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </>
  );
}
