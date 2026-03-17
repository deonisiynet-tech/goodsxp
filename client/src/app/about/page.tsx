'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Target, Award, Users, Heart, Zap, Shield, Truck, Star, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const values = [
  {
    icon: Target,
    title: 'Наша місія',
    description: 'Забезпечити кожного українця доступом до сучасних технологій за справедливою ціною.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Award,
    title: 'Якість',
    description: 'Пропонуємо тільки оригінальну продукцію від офіційних постачальників.',
    gradient: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: Users,
    title: 'Команда',
    description: 'Професійна команда експертів готова допомогти з вибором у будь-який час.',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
  {
    icon: Heart,
    title: 'Турбота',
    description: 'Ми дбаємо про кожного клієнта та супроводжуємо після покупки.',
    gradient: 'from-pink-500/20 to-pink-600/20',
  },
];

const stats = [
  { number: '100%', label: 'Надійний сервіс', icon: Shield },
  { number: '98%', label: 'Позитивних відгуків', icon: Star },
  { number: '24/7', label: 'Підтримка клієнтів', icon: Zap },
  { number: '1-3', label: 'Дні доставки', icon: Truck },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        
        {/* ===== HERO SECTION ===== */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center animate-fade-in">
                <Sparkles size={40} className="text-purple-400" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                <span className="block text-white">Про GoodsXP</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Сучасний інтернет-магазин трендової електроніки для української аудиторії
              </p>
            </div>
          </div>
        </section>

        {/* ===== MAIN CONTENT ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto mb-16">
              <div className="card p-8">
                <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    💎
                  </span>
                  Хто ми
                </h2>

                <div className="space-y-6 text-muted leading-relaxed">
                  <div>
                    <p className="text-lg">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">GoodsXP</span> — це сучасний онлайн-магазин трендових гаджетів та електроніки для української аудиторії.
                    </p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <span className="text-2xl">⌚</span>
                      Що ми пропонуємо
                    </h3>
                    <p>
                      Ми зосереджені на актуальних технологічних рішеннях: смарт-годинниках ⌚, навушниках 🎧, павербанках 🔋 та інших корисних гаджетах, які роблять щоденне життя зручнішим.
                    </p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      Наша місія
                    </h3>
                    <p>
                      Пропонувати якісні та перевірені товари за чесною ціною — без зайвої складності та переплат. Тільки те, що дійсно варте вашої уваги.
                    </p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      Чому обирають нас
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Швидка обробка замовлень по всій Україні 📦</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Жива підтримка через менеджера 💬</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>Перевірені постачальники та гарантія якості ✨</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="py-16 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Наші досягнення</h2>
              <p className="text-muted text-lg">
                Цифри, які говорять самі за себе
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="group relative p-6 rounded-2xl bg-surface/50 border border-border overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 text-center">
                    <stat.icon size={32} className="mx-auto mb-3 text-purple-400" strokeWidth={1.5} />
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <p className="text-muted text-sm">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== VALUES ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Наші цінності</h2>
              <p className="text-muted text-lg">
                Те, що робить нас особливими
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl bg-surface/50 border border-border overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <value.icon size={28} className="text-purple-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-pink-500/20 border border-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
              <div className="relative z-10 py-16 px-8 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Приєднуйтесь до нас
                </h2>
                <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
                  Зв'яжіться з нами та дізнайтеся більше про наші товари та послуги.
                  Ми завжди готові допомогти з вибором!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/catalog"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:scale-105"
                  >
                    Перейти до каталогу
                    <ArrowRight size={20} />
                  </Link>
                  <Link
                    href="/contacts"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-purple-500/30 text-white font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:bg-purple-500/20 hover:scale-105"
                  >
                    Зв'язатися з нами
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
