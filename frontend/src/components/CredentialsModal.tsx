'use client';

import { useState } from 'react';

interface Database {
  _id: string;
  name: string;
  displayName: string;
  type: string;
  version: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionString: string;
  // Campos específicos do MinIO
  consolePort?: number;
  accessKey?: string;
  secretKey?: string;
  consoleUrl?: string;
}

interface CredentialsModalProps {
  database: Database;
  onClose: () => void;
}

export default function CredentialsModal({ database, onClose }: CredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEnvFormat = () => {
    const envName = database.type.toUpperCase();
    return `${envName}_URI=${database.connectionString}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Credenciais - {database.displayName}
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

          <div className="space-y-6">
            {/* Connection String */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📋 Connection String
              </label>
              <div className="relative">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 pr-12 font-mono text-sm break-all">
                  {database.connectionString}
                </div>
                <button
                  onClick={() => copyToClipboard(database.connectionString)}
                  className="absolute top-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Copiar"
                >
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Detalhes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                📝 Detalhes
              </label>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Host:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{database.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Porta:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{database.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {database.type === 'minio' ? 'Access Key:' : 'Usuário:'}
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {database.type === 'minio' ? database.accessKey : database.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {database.type === 'minio' ? 'Secret Key:' : 'Senha:'}
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {database.type === 'minio' ? database.secretKey : database.password}
                  </span>
                </div>
                {database.type !== 'minio' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Database:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{database.database}</span>
                  </div>
                )}
                {database.type === 'minio' && database.consoleUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Console:</span>
                    <a 
                      href={database.consoleUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {database.consoleUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Para usar no projeto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔗 Para usar no seu projeto (.env)
              </label>
              <div className="relative">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 pr-12 font-mono text-sm break-all">
                  {getEnvFormat()}
                </div>
                <button
                  onClick={() => copyToClipboard(getEnvFormat())}
                  className="absolute top-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Copiar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Exemplo de uso */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Como usar</p>
                  <p>1. Copie a connection string ou o formato .env</p>
                  <p>2. Adicione no arquivo .env do seu projeto</p>
                  <p>3. Use a variável de ambiente no código</p>
                </div>
              </div>
            </div>

            {/* Aviso de segurança */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-medium mb-1">⚠️ Segurança</p>
                  <p>Nunca compartilhe suas credenciais publicamente ou em repositórios Git.</p>
                  <p>Use sempre variáveis de ambiente (.env) e adicione .env no .gitignore.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão fechar */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
