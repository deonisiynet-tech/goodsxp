'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
                <FileText size={40} className="text-primary" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                Умови використання
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
              <div className="space-y-10">
                
                {/* Section 1 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Shield size={28} className="text-primary" strokeWidth={1.5} />
                    Прийняття умов
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Використовуючи сайт goodsxp.store, ви підтверджуєте, що прочитали, зрозуміли та погоджуєтесь з цими Умовами використання. Якщо ви не згодні з будь-яким пунктом цих умов, будь ласка, не використовуйте наш сайт.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <CheckCircle size={28} className="text-primary" strokeWidth={1.5} />
                    Опис послуг
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    GoodsXP надає послуги з продажу електроніки та гаджетів через інтернет-магазин. Ми залишаємо за собою право:
                  </p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Змінювати асортимент товарів без попереднього повідомлення;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Коригувати ціни в будь-який час;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Відмовити в обслуговуванні у випадках, передбачених законодавством.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Shield size={28} className="text-primary" strokeWidth={1.5} />
                    Замовлення та оплата
                  </h2>
                  <div className="space-y-4 text-muted">
                    <p>
                      Оформлюючи замовлення на сайті, ви підтверджуєте, що:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Надали правдиву та повну інформацію;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Ознайомлені з умовами доставки та оплати;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>Згодні з вартістю замовлення, включаючи доставку.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <CheckCircle size={28} className="text-primary" strokeWidth={1.5} />
                    Доставка та повернення
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Доставка здійснюється згідно з умовами, вказаними на сайті. Повернення та обмін товару можливі протягом 14 днів з моменту отримання за умови збереження товарного вигляду та упаковки. Детальна інформація доступна в розділі "Гарантія".
                  </p>
                </div>

                {/* Section 5 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Shield size={28} className="text-primary" strokeWidth={1.5} />
                    Інтелектуальна власність
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Всі матеріали сайту (тексти, зображення, логотипи, дизайн) є власністю GoodsXP та захищені законом про авторське право. Будь-яке використання без письмового дозволу заборонено.
                  </p>
                </div>

                {/* Section 6 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <CheckCircle size={28} className="text-primary" strokeWidth={1.5} />
                    Обмеження відповідальності
                  </h2>
                  <p className="text-muted leading-relaxed">
                    GoodsXP не несе відповідальності за:
                  </p>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Тимчасові перебої в роботі сайту;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Втрату даних через дії третіх осіб;</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>Непрямі збитки, пов'язані з використанням сайту.</span>
                    </li>
                  </ul>
                </div>

                {/* Section 7 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Shield size={28} className="text-primary" strokeWidth={1.5} />
                    Зміна умов
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Ми залишаємо за собою право змінювати ці Умови використання в будь-який час. Оновлення набирають чинності з моменту публікації на сайті. Рекомендуємо періодично перевіряти цю сторінку.
                  </p>
                </div>

                {/* Section 8 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <CheckCircle size={28} className="text-primary" strokeWidth={1.5} />
                    Контакти
                  </h2>
                  <p className="text-muted leading-relaxed mb-4">
                    З питаннями щодо Умов використання звертайтесь:
                  </p>
                  <div className="space-y-3">
                    <Link 
                      href="mailto:support@goodsxp.store"
                      className="block text-primary hover:text-secondary transition-colors"
                    >
                      Email: support@goodsxp.store
                    </Link>
                    <Link 
                      href="https://t.me/goodsxp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary hover:text-secondary transition-colors"
                    >
                      Telegram: @goodsxp
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
