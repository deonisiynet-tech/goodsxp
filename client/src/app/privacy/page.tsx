'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
                <Shield size={40} className="text-primary" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                Політика конфіденційності
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Останнє оновлення: 1 березня 2026 р.
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
                    Загальні положення
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Ця Політика визначає порядок збору, зберігання та використання персональних даних користувачів сайту goodsxp.store. Використовуючи сайт, ви погоджуєтесь з умовами цієї Політики.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Збір персональних даних
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">Ми можемо збирати:</p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Ім'я, прізвище;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Контактні дані: телефон, email;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Адресу доставки;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Іншу інформацію, яку ви надаєте при замовленні або зверненні.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Мета обробки
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">Персональні дані використовуються для:</p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Оформлення та доставки замовлень;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Консультацій та підтримки;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Інформаційного супроводу за вашою згодою;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Виконання вимог законодавства.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 4 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    Правові підстави
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">Обробка даних здійснюється на підставі:</p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Вашої згоди;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Виконання договору;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Виконання законних вимог.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      5
                    </span>
                    Зберігання та захист
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Дані зберігаються лише стільки, скільки необхідно.</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Ми застосовуємо заходи для захисту даних від несанкціонованого доступу, втрати або пошкодження.</span>
                    </p>
                  </div>
                </div>

                {/* Section 6 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      6
                    </span>
                    Передача третім особам
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Персональні дані не передаються третім особам без вашої згоди, крім випадків, передбачених законодавством (кур'єрські служби, податкові органи).
                  </p>
                </div>

                {/* Section 7 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      7
                    </span>
                    Права користувачів
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">Ви маєте право:</p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Доступу до своїх даних;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Виправлення або оновлення;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Відкликати згоду на обробку;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Вимагати видалення даних, якщо це не суперечить закону.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 8 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      8
                    </span>
                    Файли cookie
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Сайт використовує cookie для покращення роботи та аналітики. Ви можете відключити cookie у налаштуваннях браузера, але деякий функціонал може стати недоступним.
                  </p>
                </div>

                {/* Section 9 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      9
                    </span>
                    Зміни до Політики
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Оновлена Політика набирає чинності з моменту публікації на сайті.
                  </p>
                </div>

                {/* Section 10 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      10
                    </span>
                    Контакти
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    Питання щодо персональних даних:
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
