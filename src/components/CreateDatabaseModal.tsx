'use client';

import { useState, useEffect } from 'react';
import DatabaseCreationLogs from './DatabaseCreationLogs';
import CredentialsModal from './CredentialsModal';
import { api } from '@/lib/api';

interface Server {
  _id: string;
  name: string;
  host: string;
}

interface CreateDatabaseModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface DatabaseVersions {
  mongodb: string[];
  mysql: string[];
  mariadb: string[];
  postgresql: string[];
  redis: string[];
  minio: string[];
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

export default function CreateDatabaseModal({ onClose, onCreated }: CreateDatabaseModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<keyof typeof DATABASE_ICONS>('mongodb');
  const [version, setVersion] = useState('7.0');
  const [serverId, setServerId] = useState('');
  const [servers, setServers] = useState<Server[]>([]);
  const [versions, setVersions] = useState<DatabaseVersions>({
    mongodb: ['7.0'],
    mysql: ['8.0'],
    mariadb: ['11.0'],
    postgresql: ['16'],
    redis: ['7.2'],
    minio: ['latest']
  });
  const [loading, setLoading] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [error, setError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [createdDatabase, setCreatedDatabase] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    fetchServers();
    fetchVersions();
  }, []);

  useEffect(() => {
    // Atualizar versão quando tipo mudar
    const availableVersions = versions[type];
    if (availableVersions && availableVersions.length > 0) {
      setVersion(availableVersions[0]);
    }
  }, [type, versions]);

  const fetchVersions = async () => {
    try {
      setLoadingVersions(true);
      const response = await api.get('/databases/versions');
      setVersions(response.data);
    } catch (error) {
      console.error('Erro ao buscar versões:', error);
      // Manter versões padrão em caso de erro
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
      if (response.data.length > 0) {
        setServerId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Iniciar criação (não aguardar resposta)
      api.post('/databases', {
        name,
        displayName: name,
        type,
        version,
        serverId,
      }).catch((error) => {
        setError(error.response?.data?.error || error.message || 'Erro ao criar banco de dados');
        setLoading(false);
        setShowLogs(false);
      });

      // Mostrar logs imediatamente
      setShowLogs(true);
      
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Erro ao criar banco de dados');
      setLoading(false);
    }
  };

  const handleCreationComplete = (database: any) => {
    setCreatedDatabase(database);
    setShowLogs(false);
    setShowCredentials(true);
    setLoading(false);
  };

  const handleCreationError = (errorMsg: string) => {
    setError(errorMsg);
    setShowLogs(false);
    setLoading(false);
  };

  const handleCredentialsClose = () => {
    setShowCredentials(false);
    onCreated();
  };

  if (showLogs) {
    return (
      <DatabaseCreationLogs
        databaseName={name}
        onComplete={handleCreationComplete}
        onError={handleCreationError}
      />
    );
  }

  if (showCredentials && createdDatabase) {
    return (
      <CredentialsModal
        database={createdDatabase}
        onClose={handleCredentialsClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Criar Banco de Dados
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Banco
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="meu-banco-db"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use apenas letras minúsculas, números e hífens
              </p>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Banco
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DATABASE_ICONS) as Array<keyof typeof DATABASE_ICONS>).map((dbType) => (
                  <button
                    key={dbType}
                    type="button"
                    onClick={() => setType(dbType)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      type === dbType
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{DATABASE_ICONS[dbType]}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {DATABASE_NAMES[dbType]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Versão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                Versão
                {loadingVersions && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (carregando...)
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchVersions}
                  disabled={loadingVersions}
                  className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  title="Atualizar versões"
                >
                  🔄 Atualizar
                </button>
              </label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={loadingVersions}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                {versions[type].map((v: string) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Versões atualizadas automaticamente do Docker Hub
              </p>
            </div>

            {/* Servidor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servidor
              </label>
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione o servidor</option>
                {servers.map((server) => (
                  <option key={server._id} value={server._id}>
                    {server.name} ({server.host})
                  </option>
                ))}
              </select>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Credenciais automáticas</p>
                  <p>Usuário, senha e connection string serão gerados automaticamente.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !serverId}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Banco'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
