'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface DeleteServerModalProps {
  server: any;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteServerModal({ server, onClose, onDeleted }: DeleteServerModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [resources, setResources] = useState({
    projects: [] as any[],
    databases: [] as any[],
    wordpress: [] as any[],
  });

  useEffect(() => {
    loadServerResources();
  }, []);

  const loadServerResources = async () => {
    try {
      setLoading(true);
      const [projectsRes, databasesRes, wordpressRes] = await Promise.all([
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/databases').catch(() => ({ data: [] })),
        api.get('/wordpress').catch(() => ({ data: [] })),
      ]);

      // Filtrar recursos deste servidor
      const serverProjects = projectsRes.data.filter((p: any) => p.serverId === server._id);
      const serverDatabases = databasesRes.data.filter((d: any) => d.serverId === server._id);
      const serverWordpress = wordpressRes.data.filter((w: any) => w.serverId === server._id);

      setResources({
        projects: serverProjects,
        databases: serverDatabases,
        wordpress: serverWordpress,
      });
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResources = resources.projects.length + resources.databases.length + resources.wordpress.length;

  const handleDelete = async () => {
    if (!password) {
      toast.error('Digite sua senha para confirmar');
      return;
    }

    try {
      setDeleting(true);

      // Verificar senha
      const verifyRes = await api.post('/auth/verify-password', { password });
      
      if (!verifyRes.data.success) {
        toast.error('Senha incorreta');
        return;
      }

      // Deletar servidor (o backend deve deletar todos os recursos associados)
      await api.delete(`/servers/${server._id}`);
      
      toast.success('Servidor e todos os recursos foram deletados com sucesso!');
      onDeleted();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Senha incorreta');
      } else {
        toast.error(error.response?.data?.error || 'Erro ao deletar servidor');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 dark:bg-red-700 px-6 py-4 flex items-center justify-between border-b border-red-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Deletar Servidor
              </h2>
              <p className="text-sm text-red-100">
                Esta ação não pode ser desfeita!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações do Servidor */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Servidor a ser deletado:
            </h3>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{server.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{server.host}</p>
              </div>
            </div>
          </div>

          {/* Recursos que serão deletados */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Carregando recursos...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aviso Principal */}
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                      ⚠️ ATENÇÃO: LIMPEZA COMPLETA DO SERVIDOR
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-400 mb-2">
                      Esta ação irá DELETAR PERMANENTEMENTE:
                    </p>
                    <ul className="text-sm text-red-800 dark:text-red-400 space-y-1 ml-4">
                      <li>• Todos os containers Docker (parados e rodando)</li>
                      <li>• Todos os volumes Docker (dados persistentes)</li>
                      <li>• Todas as imagens Docker baixadas</li>
                      <li>• Todas as redes Docker customizadas</li>
                      <li>• Todos os arquivos de projetos</li>
                      <li>• Todas as configurações de proxy (Nginx/Traefik)</li>
                      <li>• Cache de build do Docker</li>
                    </ul>
                    <p className="text-sm text-red-900 dark:text-red-300 font-bold mt-3">
                      🚫 O servidor ficará COMPLETAMENTE LIMPO. Não será possível recuperar os dados!
                    </p>
                  </div>
                </div>
              </div>

              {/* Recursos do Painel */}
              {totalResources > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
                    📋 Recursos registrados no painel ({totalResources})
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-400 mb-3">
                    Estes registros serão removidos do banco de dados:
                  </p>

                  {/* Lista de Recursos */}
                  <div className="space-y-2">
                    {resources.projects.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <h5 className="font-semibold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-2 text-sm">
                          🚀 Projetos ({resources.projects.length})
                        </h5>
                        <ul className="space-y-1">
                          {resources.projects.map((project: any) => (
                            <li key={project._id} className="text-xs text-purple-800 dark:text-purple-400 flex items-center gap-2">
                              <span className="w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
                              {project.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resources.databases.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                        <h5 className="font-semibold text-orange-900 dark:text-orange-300 mb-1 flex items-center gap-2 text-sm">
                          🗄️ Bancos de Dados ({resources.databases.length})
                        </h5>
                        <ul className="space-y-1">
                          {resources.databases.map((db: any) => (
                            <li key={db._id} className="text-xs text-orange-800 dark:text-orange-400 flex items-center gap-2">
                              <span className="w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></span>
                              {db.name} ({db.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resources.wordpress.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-2 text-sm">
                          🌐 WordPress ({resources.wordpress.length})
                        </h5>
                        <ul className="space-y-1">
                          {resources.wordpress.map((wp: any) => (
                            <li key={wp._id} className="text-xs text-blue-800 dark:text-blue-400 flex items-center gap-2">
                              <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                              {wp.siteName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {totalResources === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    ℹ️ Nenhum recurso registrado no painel, mas o servidor físico será completamente limpo de qualquer container, volume ou imagem Docker.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirmação com Senha */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Digite sua senha para confirmar
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="mt-2 w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                disabled={deleting}
                onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              />
            </label>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              Por segurança, você precisa confirmar sua senha antes de deletar o servidor.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || !password}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Deletar Servidor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
