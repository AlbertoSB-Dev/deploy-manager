'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Loader2 } from 'lucide-react';

interface BranchSelectorProps {
  owner: string;
  repo: string;
  token: string;
  value: string;
  onChange: (branch: string) => void;
  defaultBranch?: string;
}

export function BranchSelector({ owner, repo, token, value, onChange, defaultBranch }: BranchSelectorProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (owner && repo && token) {
      loadBranches();
    }
  }, [owner, repo, token]);

  const loadBranches = async () => {
    setLoading(true);
    setError('');

    console.log('🌿 Carregando branches:', { owner, repo, token: token ? '✓' : '✗' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
      const url = `${apiUrl}/github/repos/${owner}/${repo}/branches`;
      console.log('📡 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error('Erro ao carregar branches');
      }

      const data = await response.json();
      console.log('📦 Data recebida:', data);
      
      const branchNames = data.branches.map((b: any) => b.name);
      console.log('✅ Branches carregadas:', branchNames);
      setBranches(branchNames);

      // Se tem branch padrão e não tem valor selecionado, usar padrão
      if (defaultBranch && !value && branchNames.includes(defaultBranch)) {
        onChange(defaultBranch);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Erro ao carregar branches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-600">Carregando branches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="main"
        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
      />
    );
  }

  if (branches.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="main"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <div className="relative">
      <GitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
      >
        {branches.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
            {branch === defaultBranch && ' (padrão)'}
          </option>
        ))}
      </select>
    </div>
  );
}
