'use client';

import { useState } from 'react';
import { X, Database, HardDrive } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateDatabaseModalProps {
  servers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDatabaseModal({ servers, onClose, onSuccess }: CreateDatabaseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    serverId: '',
    type: 'mysql' as 'mysql' | 'postgresql' | 'mongodb' | 'mariadb' | 'redis' | 'minio',
    version: 'latest',
    username: '',
    password: '',
    port: 3306,
  });
  const [loading, setLoading] = useState(false);
  const [createAdminPanel, setCreateAdminPanel] = useState(true); // Criar painel por padrão

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.serverId || !formData.username || !formData.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Criando banco de dados...', { id: 'create-db' });
      
      const response = await api.post('/databases', formData);
      const databaseId = response.data._id;
      
      toast.success('Banco de dados criado com sucesso!', { id: 'create-db' });

      // Criar painel admin se solicitado
      if (createAdminPanel && formData.type !== 'minio') {
        toast.loading('Criando painel administrativo...', { id: 'create-panel' });
        try {
          await api.post(`/databases/${databaseId}/admin-panel`);
          toast.success('Painel administrativo criado!', { id: 'create-panel' });
        } catch (error: any) {
          toast.error('Erro ao criar painel admin', { id: 'create-panel' });
          console.error('Erro ao criar painel:', error);
        }
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar banco de dados', { id: 'create-db' });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'mysql' | 'postgresql' | 'mongodb' | 'mariadb' | 'redis' | 'minio') => {
    let defaultPort = 3306;
    if (type === 'postgresql') defaultPort = 5432;
    if (type === 'mongodb') defaultPort = 27017;
    if (type === 'mariadb') defaultPort = 3306;
    if (type === 'redis') defaultPort = 6379;
    if (type === 'minio') defaultPort = 9000;
    
    setFormData({ ...formData, type, port: defaultPort, version: 'latest' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Criar Banco de Dados</h2>
                <p className="text-sm text-orange-100 dark:text-orange-200 mt-1">
                  Configure um novo banco de dados no servidor
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Servidor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Servidor *
            </label>
            <select
              value={formData.serverId}
              onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Selecione um servidor</option>
              {servers.map((server) => (
                <option key={server._id} value={server._id}>
                  {server.name} ({server.host})
                </option>
              ))}
            </select>
          </div>

          {/* Nome do Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Banco de Dados *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: meu_banco"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use apenas letras, números e underscores
            </p>
          </div>

          {/* Tipo de Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Banco de Dados
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('mysql')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'mysql'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🐬</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">MySQL</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 3306</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleTypeChange('postgresql')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'postgresql'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🐘</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">PostgreSQL</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 5432</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleTypeChange('mongodb')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'mongodb'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🍃</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">MongoDB</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 27017</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('mariadb')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'mariadb'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">MariaDB</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 3306</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('redis')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'redis'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🔴</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Redis</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 6379</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('minio')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'minio'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <HardDrive className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">MinIO</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Porta 9000</div>
                </div>
              </button>
            </div>
          </div>

          {/* Usuário e Senha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuário *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Porta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Porta
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Versão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Versão
            </label>
            <select
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="latest">Latest (Mais recente)</option>
              {formData.type === 'mysql' && (
                <>
                  <option value="8.0">MySQL 8.0</option>
                  <option value="5.7">MySQL 5.7</option>
                </>
              )}
              {formData.type === 'mariadb' && (
                <>
                  <option value="11">MariaDB 11</option>
                  <option value="10.11">MariaDB 10.11</option>
                  <option value="10.6">MariaDB 10.6</option>
                </>
              )}
              {formData.type === 'postgresql' && (
                <>
                  <option value="16">PostgreSQL 16</option>
                  <option value="15">PostgreSQL 15</option>
                  <option value="14">PostgreSQL 14</option>
                </>
              )}
              {formData.type === 'mongodb' && (
                <>
                  <option value="7">MongoDB 7</option>
                  <option value="6">MongoDB 6</option>
                  <option value="5">MongoDB 5</option>
                </>
              )}
              {formData.type === 'redis' && (
                <>
                  <option value="7-alpine">Redis 7 Alpine</option>
                  <option value="6-alpine">Redis 6 Alpine</option>
                </>
              )}
              {formData.type === 'minio' && (
                <option value="latest">MinIO Latest</option>
              )}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recomendamos usar "latest" para ter sempre a versão mais recente
            </p>
          </div>

          {/* Checkbox para criar painel admin */}
          {formData.type !== 'minio' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createAdminPanel}
                  onChange={(e) => setCreateAdminPanel(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Criar painel administrativo
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formData.type === 'mysql' || formData.type === 'mariadb' ? 'phpMyAdmin será instalado para gerenciar o banco' : ''}
                    {formData.type === 'postgresql' ? 'Adminer será instalado para gerenciar o banco' : ''}
                    {formData.type === 'mongodb' ? 'Mongo Express será instalado para gerenciar o banco' : ''}
                    {formData.type === 'redis' ? 'Redis Commander será instalado para gerenciar o banco' : ''}
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Info MinIO */}
          {formData.type === 'minio' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>ℹ️ MinIO Console:</strong>
                <br />
                O MinIO já vem com console web integrado. Após a criação, você poderá acessá-lo diretamente.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              <strong>ℹ️ O que acontecerá:</strong>
              <br />
              1. Container Docker será criado com {formData.type.toUpperCase()}
              <br />
              2. Banco de dados será inicializado
              <br />
              3. Usuário e senha serão configurados
              <br />
              4. Porta será exposta para acesso
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Banco de Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
