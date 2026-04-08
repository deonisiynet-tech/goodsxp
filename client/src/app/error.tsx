'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-3xl font-light text-white mb-4">Щось пішло не так</h1>
        <p className="text-[#9ca3af] mb-8">
          На сторінці виникла помилка. Спробуйте оновити або поверніться на головну.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Оновити
          </button>
          <Link href="/" className="btn-secondary inline-flex items-center gap-2">
            <Home size={18} />
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
