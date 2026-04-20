import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCw, Zap, CheckCircle, Headset, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList';

// Force dynamic rendering - ProductList робить API запити
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export const metadata: Metadata = {
  title: 'GoodsXP — Сучасна електроніка та гаджети з доставкою по Україні',
  description: 'Інтернет-магазин трендової електроніки: смарт-годинники, навушники, павербанки та аксесуари. ✅ Безпечна оплата ✅ Доставка 1–3 дні Новою Поштою ✅ Гарантія 14 днів.',
  alternates: {
    canonical: siteUrl,
  },
};

function BenefitItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mb-3">
        <Icon size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <span className="text-muted font-medium">{text}</span>
    </div>
  );
}

function AdvantageCard({ icon: Icon, title, description, gradient }: { icon: any; title: string; description: string; gradient: string }) {
  return (
    <div className="group relative p-6 rounded-2xl bg-surface/50 border border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={24} className="text-white" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-purple-400 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-muted">{text}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <div className="text-sm font-medium text-white text-center">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm animate-fade-in backdrop-blur-md">
                <Zap size={16} className="text-purple-400" />
                <span className="font-medium">Нові надходження 2026</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up">
                <span className="block text-white">Розумна електроніка</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  для сучасного життя
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto animate-slide-up delay-200 backdrop-blur-md bg-surface/40 rounded-2xl p-6 border border-border/50">
                Трендові гаджети для щоденного комфорту.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
                <Link
                  href="/catalog"
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-4 sm:px-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <span className="relative z-10">Перейти до каталогу</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:px-8 border border-purple-500/30 text-white font-semibold rounded-2xl backdrop-blur-md bg-purple-500/10 transition-all duration-300 hover:bg-purple-500/20 hover:scale-105 w-full sm:w-auto"
                >
                  Про нас
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 animate-fade-in delay-500">
                <BenefitItem icon={Truck} text="Доставка по Україні" />
                <BenefitItem icon={Shield} text="Безпечна оплата" />
                <BenefitItem icon={RefreshCw} text="Гарантія повернення" />
              </div>
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="py-12 md:py-24 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdvantageCard icon={Truck} title="Доставка" description="Швидка доставка по Україні: 1–3 дні" gradient="from-blue-500/20 to-cyan-500/20" />
              <AdvantageCard icon={Shield} title="Оплата" description="Безпечна оплата: онлайн або при отриманні" gradient="from-green-500/20 to-emerald-500/20" />
              <AdvantageCard icon={RefreshCw} title="Гарантія повернення" description="14 днів на повернення товару" gradient="from-purple-500/20 to-pink-500/20" />
              <AdvantageCard icon={CheckCircle} title="Якість перевірена" description="Всі товари перевірені нашими партнерами" gradient="from-orange-500/20 to-yellow-500/20" />
            </div>
          </div>
        </section>

        {/* How to order */}
        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-center">Як замовити?</h2>
            <p className="text-muted text-base sm:text-lg mb-10 md:mb-16 text-center max-w-2xl mx-auto">Всього 3 простих кроки — і товар у вас</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-3xl sm:text-4xl">🛒</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">1. Обери товар</h3>
                <p className="text-muted text-sm">Переглянь каталог та додай товари до кошика</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-3xl sm:text-4xl">📋</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">2. Оформи замовлення</h3>
                <p className="text-muted text-sm">Вкажи дані та обери відділення Нової Пошти</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-3xl sm:text-4xl">📦</div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-white">3. Отримай посилку</h3>
                <p className="text-muted text-sm">Забери на відділенні. Оглянь перед оплатою.</p>
              </div>
            </div>
          </div>
        </section>

        <ProductList title="Популярні товари" limit={5} showAllLink popular />

        {/* Why Choose Us */}
        <section className="py-12 md:py-24 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">Чому обирають GoodsXP</h2>
                <p className="text-muted text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                  Ми не просто магазин — ми ваш надійний партнер у світі технологій.
                </p>
                <div className="space-y-4">
                  <FeatureItem text="Перевірена якість товарів" />
                  <FeatureItem text="Професійна консультація" />
                  <FeatureItem text="Швидка обробка замовлень" />
                  <FeatureItem text="Постійні оновлення асортименту" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard icon={Truck} label="Стабільні поставки" />
                <StatCard icon={Shield} label="Гарантія безпеки" />
                <StatCard icon={Heart} label="Довіра клієнтів" />
                <StatCard icon={Headset} label="Жива підтримка" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/20">
              <div className="relative z-10 py-12 md:py-24 px-4 sm:px-8 text-center">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">Готові до покупок?</h2>
                <p className="text-muted text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                  Відкрийте для себе кращі гаджети на GoodsXP вже сьогодні
                </p>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 sm:px-8 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  Перейти до каталогу
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
