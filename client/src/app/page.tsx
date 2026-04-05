'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Shield, RefreshCw, Star, Zap, CheckCircle, Headset, Package } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductList from '@/components/ProductList';

// ===== SUBCOMPONENTS =====

function BenefitItem({
  icon: Icon,
  text
}: {
  icon: any;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mb-3">
        <Icon size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <span className="text-muted font-medium">{text}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          </div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm animate-fade-in backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Zap size={16} className="text-purple-400" />
                <span className="font-medium">Нові надходження 2026</span>
              </div>

              {/* Main Heading - top white, bottom gradient */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up">
                <span className="block text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  Розумна електроніка
                </span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  для сучасного життя
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto animate-slide-up delay-200 backdrop-blur-md bg-surface/40 rounded-2xl p-6 border border-border/50 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
                Трендові гаджети для щоденного комфорту.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
                <Link
                  href="/catalog"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:scale-105 hover:from-purple-400 hover:to-pink-400"
                >
                  <span className="relative z-10">Перейти до каталогу</span>
                  <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-purple-500/30 text-white font-semibold rounded-2xl backdrop-blur-md bg-purple-500/10 transition-all duration-300 hover:bg-purple-500/20 hover:scale-105 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  Про нас
                </Link>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 animate-fade-in delay-500">
                <BenefitItem
                  icon={Truck}
                  text="Доставка по Україні"
                />
                <BenefitItem
                  icon={Shield}
                  text="Безпечна оплата"
                />
                <BenefitItem
                  icon={RefreshCw}
                  text="Гарантія повернення"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== ADVANTAGES SECTION - 4 INFO BLOCKS ===== */}
        <section className="py-24 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdvantageCard
                icon={Truck}
                title="Доставка"
                description="Швидка доставка по Україні: 1–3 дні"
                gradient="from-blue-500/20 to-cyan-500/20"
              />
              <AdvantageCard
                icon={Shield}
                title="Оплата"
                description="Безпечна оплата: онлайн або при отриманні"
                gradient="from-green-500/20 to-emerald-500/20"
              />
              <AdvantageCard
                icon={RefreshCw}
                title="Гарантія повернення"
                description="14 днів на повернення товару відповідно до законодавства України"
                gradient="from-purple-500/20 to-pink-500/20"
              />
              <AdvantageCard
                icon={CheckCircle}
                title="Якість перевірена партнерами"
                description="Всі товари перевірені нашими надійними партнерами, щоб гарантувати вам безпечну та якісну покупку"
                gradient="from-orange-500/20 to-yellow-500/20"
              />
            </div>
          </div>
        </section>

        {/* ===== POPULAR PRODUCTS ===== */}
        <ProductList title="Популярні товари" limit={5} showAllLink popular />

        {/* ===== WHY CHOOSE US ===== */}
        <section className="py-24 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Чому обирають GoodsXP
                </h2>
                <p className="text-muted text-lg mb-8 leading-relaxed">
                  Ми не просто магазин — ми ваш надійний партнер у світі технологій.
                  Кожен товар проходить ретельну перевірку, а наша команда експертів
                  готова допомогти з вибором у будь-який час.
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
                <StatCard icon={Star} label="Довіра клієнтів" />
                <StatCard icon={Headset} label="Жива підтримка" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10 py-16 md:py-24 px-8 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Готові до покупок?
                </h2>
                <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                  Відкрийте для себе кращі гаджети на GoodsXP вже сьогодні
                </p>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
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

function AdvantageCard({
  icon: Icon,
  title,
  description,
  gradient
}: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative p-6 rounded-2xl bg-surface/50 border border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
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
    <div className="group p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-1">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon size={24} className="text-white" strokeWidth={1.5} />
      </div>
      <div className="text-sm font-medium text-white text-center">{label}</div>
    </div>
  );
}
