import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogContent from './CatalogContent';

export default function CatalogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f12]">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#9ca3af] text-lg">Завантаження...</div>
        </div>
      }>
        <CatalogContent />
      </Suspense>
      <Footer />
    </div>
  );
}
