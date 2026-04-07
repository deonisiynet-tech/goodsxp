import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogContent from './CatalogContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export const metadata: Metadata = {
  title: 'Каталог — Електроніка та гаджети | GoodsXP',
  description: 'Повний каталог трендової електроніки: смарт-годинники, навушники, павербанки, аксесуари. Фільтри, сортування, доставка Новою Поштою.',
  openGraph: {
    title: 'Каталог — Електроніка та гаджети | GoodsXP',
    description: 'Повний каталог трендової електроніки з доставкою по Україні.',
    url: `${siteUrl}/catalog`,
  },
  alternates: {
    canonical: `${siteUrl}/catalog`,
  },
};

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
