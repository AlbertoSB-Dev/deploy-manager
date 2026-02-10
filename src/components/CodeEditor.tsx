'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { sftpService } from '@/services/sftpService';
import toast from 'react-hot-toast';
import { X, Save, Download } from 'lucide-react';

interface CodeEditorProps {
  serverId: string;
  filePath: string;
  onClose: () => void;
}

export default function CodeEditor({ serverId, filePath, onClose }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fileName = filePath.split('/').pop() || '';
  const fileExtension = fileName.split('.').pop() || '';

  // Detectar linguagem baseado na extensão
  const getLanguage = () => {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      html: 'html',
      css: 'css',
      scss: 'scss',
      py: 'python',
      php: 'php',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      sh: 'shell',
      bash: 'shell',
      sql: 'sql',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      txt: 'plaintext',
    };

    return languageMap[fileExtension] || 'plaintext';
  };

  useEffect(() => {
    loadFile();
  }, []);

  const loadFile = async () => {
    setLoading(true);
    try {
      const data = await sftpService.readFile(serverId, filePath);
      setContent(data);
    } catch (error: any) {
      toast.error(`Erro ao carregar arquivo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await sftpService.writeFile(serverId, filePath, content);
      setIsDirty(false);
      toast.success('Arquivo salvo com sucesso');
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Download iniciado');
  };

  const handleClose = () => {
    if (isDirty) {
      if (!confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
        return;
      }
    }
    onClose();
  };

  // Atalho Ctrl+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold">{fileName}</h2>
          <p className="text-sm text-gray-600 font-mono">{filePath}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
            title="Download"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Salvar (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Carregando arquivo...</div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getLanguage()}
            value={content}
            onChange={(value) => {
              setContent(value || '');
              setIsDirty(true);
            }}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              rulers: [80, 120],
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-sm text-gray-600">
        <div>
          Linguagem: <span className="font-semibold">{getLanguage()}</span>
        </div>
        <div>
          {isDirty && <span className="text-orange-600">● Não salvo</span>}
          {!isDirty && <span className="text-green-600">✓ Salvo</span>}
        </div>
      </div>
    </div>
  );
}
