'use client';

import Link from 'next/link';
import { ArrowLeft, Search, Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-lg mx-auto text-center py-16">
          {/* 404 Number */}
          <div className="relative mb-8">
            <span className="text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              404
            </span>
            <div className="absolute inset-0 blur-3xl opacity-20 bg-purple-500 rounded-full" />
          </div>

          <h1 className="text-3xl font-light mb-4">
            Сторінку не знайдено
          </h1>
          <p className="text-muted text-lg mb-10 max-w-md mx-auto">
            Можливо, вона була видалена, перейменована або ви перейшли за невірним посиланням.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Search size={18} />
              Перейти до каталогу
            </Link>
            <button
              onClick={() => router.back()}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Повернутися назад
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-[#26262b]">
            <p className="text-muted text-sm mb-4">Популярні розділи:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { href: '/', label: '🏠 Головна' },
                { href: '/catalog', label: '🛍️ Каталог' },
                { href: '/about', label: 'ℹ️ Про нас' },
                { href: '/contacts', label: '📞 Контакти' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 bg-[#1f1f23] border border-[#26262b] rounded-xl text-sm text-muted hover:text-white hover:border-purple-500/50 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
