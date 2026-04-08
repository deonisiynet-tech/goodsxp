'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      <div className="text-center max-w-md mx-auto py-20">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-light text-white mb-3">Помилка завантаження товару</h2>
        <p className="text-[#9ca3af] mb-6">
          Не вдалося завантажити інформацію про товар.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={18} />
            Спробувати знову
          </button>
          <Link href="/catalog" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            До каталогу
          </Link>
        </div>
      </div>
    </div>
  );
}
