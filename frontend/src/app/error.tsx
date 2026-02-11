'use client';

export const dynamic = 'force-dynamic';

import { useEffect } };

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">500</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Algo deu errado!</p>
        <button
          onClick={() => reset()}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
