'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      let errorMessage = 'Erro ao fazer login com Google';
      
      switch (error) {
        case 'no_code':
          errorMessage = 'Código de autorização não recebido';
          break;
        case 'not_configured':
          errorMessage = 'Google OAuth não configurado no servidor';
          break;
        case 'no_token':
          errorMessage = 'Token não recebido do Google';
          break;
        case 'callback_failed':
          errorMessage = 'Falha no processo de autenticação';
          break;
      }

      toast.error(errorMessage);
      router.push('/login');
      return;
    }

    if (token) {
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      
      // Buscar dados do usuário
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.data));
            document.cookie = `token=${token}; path=/; max-age=2592000`; // 30 dias
            toast.success('Login realizado com sucesso!');
            router.push('/dashboard');
          } else {
            throw new Error(data.error);
          }
        })
        .catch(err => {
          console.error('Erro ao buscar usuário:', err);
          toast.error('Erro ao completar login');
          router.push('/login');
        });
    } else {
      toast.error('Token não recebido');
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Completando login com Google...</p>
      </div>
    </div>
  );
}
