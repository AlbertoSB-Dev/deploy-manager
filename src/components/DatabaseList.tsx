'use client';

import { useState, useEffect } from 'react';
import DatabaseCard from '@/components/DatabaseCard';
import CreateDatabaseModal from '@/components/CreateDatabaseModal';
import { api } from '@/lib/api';

interface Database {
  _id: string;
  name: string;
  displayName: string;
  type: 'mongodb' | 'mysql' | 'mariadb' | 'postgresql' | 'redis';
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
  createdAt: string;
  updatedAt: string;
}

export default function DatabaseList() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDatabases = async () => {
    try {
      const response = await api.get('/databases');
      setDatabases(response.data);
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleDatabaseCreated = () => {
    fetchDatabases();
    setShowCreateModal(false);
  };

  const handleDatabaseDeleted = () => {
    fetchDatabases();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando bancos de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bancos de Dados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus bancos de dados remotos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Banco
        </button>
      </div>

      {databases.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🗄️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum banco de dados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie seu primeiro banco de dados para começar
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Criar Banco de Dados
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {databases.map((database) => (
            <DatabaseCard
              key={database._id}
              database={database}
              onDeleted={handleDatabaseDeleted}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateDatabaseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleDatabaseCreated}
        />
      )}
    </div>
  );
}
