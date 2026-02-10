'use client';

import { useState, useEffect } from 'react';
import { sftpService, FileItem } from '@/services/sftpService';
import toast from 'react-hot-toast';
import {
  Folder,
  File,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  FolderPlus,
  FilePlus,
  Search,
  Home,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { formatBytes, formatDate } from '@/utils/formatters';
import FileUploader from './FileUploader';
import CodeEditor from './CodeEditor';

interface FileManagerProps {
  serverId: string;
  initialPath?: string;
}

export default function FileManager({ serverId, initialPath = '/' }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentPath, serverId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await sftpService.listDirectory(serverId, currentPath);
      setFiles(data);
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      
      // Se for erro 500, mostrar mensagem mais específica
      if (error.response?.status === 500) {
        toast.error(
          `Erro no servidor: ${error.response?.data?.error || error.message}\n\n` +
          'Verifique se o servidor tem SFTP habilitado e as credenciais estão corretas.'
        );
      } else {
        toast.error(`Erro ao carregar arquivos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFiles([]);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/');
    navigateTo(newPath || '/');
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let accPath = '';
    for (const part of parts) {
      accPath += '/' + part;
      breadcrumbs.push({ name: part, path: accPath });
    }
    
    return breadcrumbs;
  };

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      navigateTo(file.path);
    } else {
      // Abrir editor para arquivos de texto
      const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html', '.xml', '.yaml', '.yml', '.env', '.sh', '.py', '.php', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.rb', '.sql'];
      const isText = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isText) {
        setEditingFile(file.path);
      } else {
        handleDownload(file.path);
      }
    }
  };

  const handleDownload = async (path: string) => {
    try {
      const blob = await sftpService.downloadFile(serverId, path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado');
    } catch (error: any) {
      toast.error(`Erro ao baixar: ${error.message}`);
    }
  };

  const handleDelete = async (path: string, isDirectory: boolean) => {
    if (!confirm(`Tem certeza que deseja excluir ${isDirectory ? 'esta pasta' : 'este arquivo'}?`)) {
      return;
    }

    try {
      await sftpService.delete(serverId, path, isDirectory);
      toast.success('Excluído com sucesso');
      loadFiles();
    } catch (error: any) {
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (!name) return;

    const newPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;

    try {
      await sftpService.createDirectory(serverId, newPath);
      toast.success('Pasta criada com sucesso');
      loadFiles();
    } catch (error: any) {
      toast.error(`Erro ao criar pasta: ${error.message}`);
    }
  };

  const handleCreateFile = async () => {
    const name = prompt('Nome do novo arquivo:');
    if (!name) return;

    const newPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;

    try {
      await sftpService.writeFile(serverId, newPath, '');
      toast.success('Arquivo criado com sucesso');
      loadFiles();
    } catch (error: any) {
      toast.error(`Erro ao criar arquivo: ${error.message}`);
    }
  };

  const handleRename = async (oldPath: string) => {
    const oldName = oldPath.split('/').pop();
    const newName = prompt('Novo nome:', oldName);
    if (!newName || newName === oldName) return;

    const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;

    try {
      await sftpService.rename(serverId, oldPath, newPath);
      toast.success('Renomeado com sucesso');
      loadFiles();
    } catch (error: any) {
      toast.error(`Erro ao renomear: ${error.message}`);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) {
      return <Folder className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    }
    return <File className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
  };

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  if (editingFile) {
    return (
      <CodeEditor
        serverId={serverId}
        filePath={editingFile}
        onClose={() => {
          setEditingFile(null);
          loadFiles();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Gerenciador de Arquivos</h1>
          <button
            onClick={loadFiles}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          {getBreadcrumbs().map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
              <button
                onClick={() => navigateTo(crumb.path)}
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button
            onClick={handleCreateFile}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <FilePlus className="w-4 h-4" />
            Novo Arquivo
          </button>
          
          {/* Search */}
          <div className="ml-auto flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 transition-colors">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Carregando...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Nenhum arquivo encontrado' : 'Pasta vazia'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                <th className="pb-2">Nome</th>
                <th className="pb-2">Tamanho</th>
                <th className="pb-2">Modificado</th>
                <th className="pb-2">Permissões</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.path}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <td
                    className="py-3 flex items-center gap-2"
                    onClick={() => handleFileClick(file)}
                  >
                    {getFileIcon(file)}
                    <span className="text-gray-900 dark:text-white">{file.name}</span>
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {file.isDirectory ? '-' : formatBytes(file.size)}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(file.modifyTime)}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {file.rights.user}{file.rights.group}{file.rights.other}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {!file.isDirectory && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFile(file.path);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.path);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(file.path);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                        title="Renomear"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.path, file.isDirectory);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Uploader Modal */}
      {showUploader && (
        <FileUploader
          serverId={serverId}
          targetPath={currentPath}
          onClose={() => setShowUploader(false)}
          onComplete={() => {
            setShowUploader(false);
            loadFiles();
          }}
        />
      )}
    </div>
  );
}
