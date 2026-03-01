'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface to-background" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-[128px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="section-title mb-6 animate-fade-in">
          <span className="block text-4xl md:text-6xl lg:text-7xl font-light tracking-tight">
            GoodsXP
          </span>
          <span className="block text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mt-2">
            Сучасна електроніка для твого життя
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 animate-slide-up">
          Найновіші гаджети та техніка від провідних світових брендів. 
          Гарантія якості та швидка доставка по всій Україні.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <Link href="/catalog" className="btn-primary inline-flex items-center justify-center gap-2">
            Перейти до каталогу
            <ArrowRight size={20} />
          </Link>
          <Link href="/contacts" className="btn-secondary inline-flex items-center justify-center">
            Зв'язатися з нами
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted rounded-full animate-ping" />
        </div>
      </div>
    </section>
  );
}
