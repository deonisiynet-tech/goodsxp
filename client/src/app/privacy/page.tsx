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
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Ця Політика конфіденційності визначає порядок збору, використання та захисту персональних даних користувачів сайту goodsxp.store.
                    </p>
                    <p>
                      Користуючись сайтом, користувач підтверджує свою згоду на обробку персональних даних відповідно до Закону України «Про захист персональних даних».
                    </p>
                    <p>
                      Якщо користувач не погоджується з умовами цієї політики, він повинен припинити використання сайту.
                    </p>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Адміністрація сайту
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Адміністратором сайту goodsxp.store є приватна особа, що здійснює діяльність з продажу товарів через мережу Інтернет.
                    </p>
                    <p className="font-medium text-white">
                      Контактна інформація адміністрації сайту:
                    </p>
                    <div className="space-y-2 ml-4">
                      <p className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" />
                        <span>Email: support@goodsxp.store</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-primary" />
                        <span>Telegram: @goodsxp</span>
                      </p>
                    </div>
                    <p>
                      Адміністрація сайту відповідає за обробку персональних даних користувачів відповідно до чинного законодавства України.
                    </p>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Які дані ми збираємо
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    Під час використання сайту можуть збиратися такі дані:
                  </p>
                  <ul className="space-y-2 text-muted ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>ім'я та прізвище</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>номер телефону</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>адреса доставки</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>email (за необхідності)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>інформація про замовлення</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>IP-адреса</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>тип браузера та пристрою</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>файли cookie</span>
                    </li>
                  </ul>
                  <p className="text-muted leading-relaxed mt-4">
                    Ці дані надаються користувачем добровільно під час оформлення замовлення.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    Мета обробки даних
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    Персональні дані використовуються для:
                  </p>
                  <ul className="space-y-2 text-muted ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>оформлення замовлення</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>доставки товару</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>зв'язку з клієнтом</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>уточнення деталей замовлення</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>обробки повернень</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>покращення роботи сайту</span>
                    </li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      5
                    </span>
                    Правові підстави
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    Обробка персональних даних здійснюється на підставі:
                  </p>
                  <ul className="space-y-2 text-muted ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>добровільної згоди користувача</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>необхідності виконання замовлення</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>законних інтересів адміністрації сайту</span>
                    </li>
                  </ul>
                </div>

                {/* Section 6 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      6
                    </span>
                    Оплата
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      На сайті goodsxp.store доступні такі способи оплати:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Післяплата (накладений платіж) при отриманні товару у службі доставки</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Повна передоплата за домовленістю з покупцем</span>
                      </li>
                    </ul>
                    <p className="font-medium text-white">
                      Сайт не зберігає платіжні реквізити банківських карток користувачів.
                    </p>
                  </div>
                </div>

                {/* Section 7 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      7
                    </span>
                    Передача даних третім особам
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Персональні дані можуть передаватися третім особам лише для виконання замовлення.
                    </p>
                    <p className="font-medium text-white">
                      До таких осіб можуть належати:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>служби доставки, наприклад Nova Poshta</span>
                      </li>
                    </ul>
                    <p>
                      Передача даних здійснюється лише у необхідному обсязі.
                    </p>
                  </div>
                </div>

                {/* Section 8 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      8
                    </span>
                    Зберігання персональних даних
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Персональні дані зберігаються протягом строку, необхідного для обробки замовлення та виконання зобов'язань перед клієнтом.
                  </p>
                </div>

                {/* Section 9 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      9
                    </span>
                    Захист даних
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Адміністрація сайту застосовує технічні та організаційні заходи для захисту персональних даних:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>захищене з'єднання HTTPS</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>обмежений доступ до даних</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>захист від несанкціонованого доступу</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 10 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      10
                    </span>
                    Права користувача
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    Користувач має право:
                  </p>
                  <ul className="space-y-2 text-muted ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>отримати інформацію про обробку своїх даних</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>вимагати зміну або виправлення даних</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>відкликати згоду на обробку даних</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>вимагати видалення персональних даних</span>
                    </li>
                  </ul>
                  <p className="text-muted leading-relaxed mt-4">
                    Запит можна надіслати на email: support@goodsxp.store
                  </p>
                </div>

                {/* Section 11 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      11
                    </span>
                    Файли cookie
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Сайт використовує cookie для:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>стабільної роботи сайту</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>аналізу відвідуваності</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>покращення користувацького досвіду</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 12 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      12
                    </span>
                    Зміни політики
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Адміністрація сайту може змінювати цю Політику конфіденційності.
                    </p>
                    <p className="font-medium text-white">
                      Оновлена версія набирає чинності з моменту публікації на сайті.
                    </p>
                  </div>
                </div>

                {/* Section 13 */}
                <div className="mb-10 animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold">
                      13
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
