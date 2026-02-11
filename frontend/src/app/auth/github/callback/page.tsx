'use client';

export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Rocket } from 'lucide-react';

function GitHubCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔍 GitHub Callback recebido:');
    console.log('  Code:', code ? 'Presente' : 'Ausente');
    console.log('  State:', state);
    console.log('  Error:', error);

    if (error) {
      console.error('❌ Erro OAuth:', error);
      if (window.opener) {
        window.opener.postMessage(
          { type: 'github-oauth-error', error },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (code) {
      console.log('✅ Enviando código para janela pai via postMessage');
      // Enviar código para a janela pai (popup)
      if (window.opener) {
        window.opener.postMessage(
          { type: 'github-oauth-code', code, state },
          window.location.origin
        );
        console.log('📤 postMessage enviado, fechando popup...');
        setTimeout(() => window.close(), 1000);
      } else {
        console.warn('⚠️ window.opener não encontrado, redirecionando para dashboard');
        // Fallback: redirecionar para dashboard se não for popup
        const params = new URLSearchParams();
        if (code) params.set('code', code);
        if (state) params.set('state', state);
        params.set('github', 'connecting');
        window.location.href = `/dashboard?${params.toString()}`;
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-6 animate-pulse">
          <Rocket className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Autenticando com GitHub...
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Conectando sua conta GitHub
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Esta janela fechará automaticamente
        </p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando...</p>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}
