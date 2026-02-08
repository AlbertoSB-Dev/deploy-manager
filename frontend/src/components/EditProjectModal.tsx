'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface EditProjectModalProps {
  project: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    branch: '',
    port: '',
    domain: '',
    buildCommand: '',
    startCommand: '',
    envVars: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Preencher formulário com dados atuais
    setFormData({
      displayName: project.displayName || '',
      branch: project.branch || 'main',
      port: project.port?.toString() || '',
      domain: project.domain || '',
      buildCommand: project.buildCommand || '',
      startCommand: project.startCommand || '',
      envVars: Object.entries(project.envVars || {})
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
    });
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      toast.loading('Salvando alterações...', { id: 'save' });

      // Parse env vars
      const envVarsObj: Record<string, string> = {};
      if (formData.envVars) {
        formData.envVars.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVarsObj[key.trim()] = valueParts.join('=').trim();
          }
        });
      }

      await api.put(`/projects/${project._id}`, {
        displayName: formData.displayName,
        branch: formData.branch,
        port: formData.port ? parseInt(formData.port) : undefined,
        domain: formData.domain || undefined,
        buildCommand: formData.buildCommand,
        startCommand: formData.startCommand,
        envVars: envVarsObj
      });

      toast.success('Projeto atualizado com sucesso!', { id: 'save' });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar alterações', { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Projeto</h2>
            <p className="text-sm text-gray-600 mt-1">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Exibição *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Meu Projeto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="main"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porta
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="3000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domínio
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder={`${project.name}.localhost`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.domain 
                  ? "Domínio customizado para acessar sua aplicação" 
                  : `Será usado: ${project.name}.localhost`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comando de Build
              </label>
              <input
                type="text"
                value={formData.buildCommand}
                onChange={(e) => setFormData({ ...formData, buildCommand: e.target.value })}
                placeholder="npm run build"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comando de Start
              </label>
              <input
                type="text"
                value={formData.startCommand}
                onChange={(e) => setFormData({ ...formData, startCommand: e.target.value })}
                placeholder="npm start"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variáveis de Ambiente
              </label>
              <textarea
                value={formData.envVars}
                onChange={(e) => setFormData({ ...formData, envVars: e.target.value })}
                placeholder="NODE_ENV=production&#10;API_URL=https://api.example.com"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Uma variável por linha (KEY=value)</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Atenção:</strong> Após salvar as alterações, você precisará fazer um novo deploy para aplicar as mudanças.
              </p>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
