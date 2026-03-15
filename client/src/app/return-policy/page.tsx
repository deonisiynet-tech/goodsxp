'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, Mail, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* ===== HERO SECTION ===== */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center animate-fade-in">
                <Package size={40} className="text-primary" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                Політика повернення
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Повернення та обмін товару протягом 30 днів
              </p>
            </div>
          </div>
        </section>

        {/* ===== CONTENT ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-invert prose-lg max-w-none">

                {/* Section 1 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Умови повернення
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p>
                      Ви можете повернути товар протягом <strong className="text-white">30 днів</strong> з моменту отримання замовлення за умови дотримання таких вимог:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
                        <span>Товар не був у використанні</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
                        <span>Збережено товарний вигляд та упаковку</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
                        <span>Наявні всі ярлики та пломби</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
                        <span>Є документ, що підтверджує покупку</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Термін повернення
                  </h2>
                  <div className="bg-surfaceLight border border-border rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <Clock size={24} className="text-primary shrink-0" />
                      <div>
                        <h3 className="font-medium text-white mb-2">30 днів на повернення</h3>
                        <p className="text-muted leading-relaxed">
                          Повернення товару можливе протягом 30 календарних днів з дати отримання замовлення. 
                          Після закінчення цього терміну повернення не приймаються.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Обробка повернення
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p>Після отримання вашого повернення:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">1.</span>
                        <span>Ми перевіримо стан товару протягом <strong className="text-white">3-5 робочих днів</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">2.</span>
                        <span>Повідомимо вас про рішення щодо повернення коштів</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">3.</span>
                        <span>Повернення коштів здійснюється протягом <strong className="text-white">7-14 робочих днів</strong> після схвалення</span>
                      </li>
                    </ul>
                    <p className="mt-4">
                      Кошти повертаються тим же способом, яким була здійснена оплата.
                    </p>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    Пошкоджені товари
                  </h2>
                  <div className="bg-surfaceLight border border-border rounded-xl p-6">
                    <h3 className="font-medium text-white mb-4">Якщо ви отримали пошкоджений або дефектний товар:</h3>
                    <ul className="space-y-3 text-muted">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Негайно зв'яжіться з нами протягом <strong className="text-white">48 годин</strong> після отримання</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Надайте фотографії пошкодження та упаковки</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Збережіть усі упаковальні матеріали до вирішення питання</span>
                      </li>
                    </ul>
                    <p className="mt-4">
                      Ми замінимо пошкоджений товар або повернемо повну вартість замовлення, включаючи витрати на доставку.
                    </p>
                  </div>
                </div>

                {/* Section 5 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      5
                    </span>
                    Товари, що не підлягають поверненню
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p>Не підлягають поверненню:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-1">✕</span>
                        <span>Товари зі знятими захисними пломбами</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-1">✕</span>
                        <span>Товари зі слідами використання</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-1">✕</span>
                        <span>Індивідуальні замовлення, виготовлені під конкретні вимоги</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-400 font-bold mt-1">✕</span>
                        <span>Програмне забезпечення з відкритими ліцензійними ключами</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 6 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      6
                    </span>
                    Як оформити повернення
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p>Для оформлення повернення:</p>
                    <ol className="space-y-3 list-decimal list-inside">
                      <li>Зв'яжіться з нашою службою підтримки</li>
                      <li>Надайте номер замовлення та причину повернення</li>
                      <li>Отримайте інструкції щодо відправки</li>
                      <li>Упакуйте товар у початкову упаковку</li>
                      <li>Відправте товар за вказаною адресою</li>
                    </ol>
                  </div>
                </div>

                {/* Section 7 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      7
                    </span>
                    Контакти для повернень
                  </h2>
                  <div className="space-y-4">
                    <p className="text-muted">
                      З питань повернення та обміну звертайтеся:
                    </p>
                    <div className="space-y-3">
                      <Link
                        href="mailto:support@goodsxp.store"
                        className="flex items-center gap-3 text-muted hover:text-primary transition-colors group"
                      >
                        <Mail size={20} className="text-primary group-hover:scale-110 transition-transform" />
                        <span>Email: support@goodsxp.store</span>
                      </Link>
                      <Link
                        href="https://t.me/goodsxp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted hover:text-primary transition-colors group"
                      >
                        <MessageCircle size={20} className="text-primary group-hover:scale-110 transition-transform" />
                        <span>Telegram: @goodsxp</span>
                      </Link>
                    </div>
                    <p className="text-muted mt-4">
                      Час роботи служби підтримки: <strong className="text-white">Пн-Пт: 9:00 - 20:00</strong>
                    </p>
                  </div>
                </div>

              </div>

              {/* Back to top */}
              <div className="mt-16 pt-8 border-t border-border">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors"
                >
                  ← Повернутися на головну
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
