'use client';

import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Динамічний імпорт CookieBanner без SSR
const CookieBanner = dynamic(() => import('./CookieBanner'), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted && (
        <>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <CookieBanner />
        </>
      )}
    </>
  );
}
