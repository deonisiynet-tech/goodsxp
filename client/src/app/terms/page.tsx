'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, Mail, MessageCircle } from 'lucide-react';
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
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      1
                    </span>
                    Прийняття умов
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Використовуючи сайт goodsxp.store, ви підтверджуєте, що прочитали, зрозуміли та погоджуєтесь з цими Умовами використання.
                    </p>
                    <p>
                      Якщо ви не погоджуєтесь з будь-яким пунктом цих умов, будь ласка, припиніть використання сайту.
                    </p>
                    <p>
                      Оформлюючи замовлення на сайті, користувач також підтверджує свою згоду з Політикою конфіденційності, опублікованою на сайті.
                    </p>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      2
                    </span>
                    Опис послуг
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      GoodsXP надає інформаційний сервіс для ознайомлення користувачів з асортиментом електроніки та гаджетів, а також можливість оформлення замовлення товарів через інтернет-сайт.
                    </p>
                    <p className="font-medium text-white">
                      Ми залишаємо за собою право:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>змінювати асортимент товарів без попереднього повідомлення;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>змінювати ціни на товари;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>тимчасово обмежувати доступ до сайту для проведення технічного обслуговування;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>відмовити в обслуговуванні у випадках, передбачених законодавством України.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      3
                    </span>
                    Замовлення та оплата
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p className="font-medium text-white">
                      Оформлюючи замовлення на сайті, користувач підтверджує, що:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>надав правдиву та повну інформацію;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>ознайомлений з умовами доставки та оплати;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>погоджується з вартістю замовлення.</span>
                      </li>
                    </ul>
                    <p className="font-medium text-white">
                      Оплата товарів може здійснюватися наступними способами:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>післяплата (накладений платіж) при отриманні товару у службі доставки;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>повна передоплата за домовленістю з покупцем.</span>
                      </li>
                    </ul>
                    <p>
                      Детальна інформація про способи оплати та доставки доступна у відповідному розділі сайту.
                    </p>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      4
                    </span>
                    Доставка
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Доставка товарів здійснюється через служби доставки, зокрема Нова Пошта.
                    </p>
                    <p>
                      Терміни та вартість доставки можуть залежати від регіону доставки, служби перевізника та умов конкретного замовлення.
                    </p>
                  </div>
                </div>

                {/* Section 5 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      5
                    </span>
                    Повернення та обмін
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Повернення або обмін товару можливі протягом 14 календарних днів з моменту отримання товару відповідно до Закону України "Про захист прав споживачів".
                    </p>
                    <p className="font-medium text-white">
                      Повернення або обмін можливі за умови:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>збереження товарного вигляду товару;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>відсутності слідів використання;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>наявності оригінальної упаковки та комплектуючих.</span>
                      </li>
                    </ul>
                    <p>
                      Детальна інформація щодо гарантії та повернення може бути розміщена у відповідному розділі сайту.
                    </p>
                  </div>
                </div>

                {/* Section 6 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      6
                    </span>
                    Інтелектуальна власність
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Усі матеріали, розміщені на сайті goodsxp.store, включаючи тексти, зображення, логотипи, дизайн та інші елементи, є власністю GoodsXP або використовуються на законних підставах.
                    </p>
                    <p className="font-medium text-white">
                      Будь-яке копіювання, поширення або використання матеріалів сайту без письмового дозволу заборонено.
                    </p>
                  </div>
                </div>

                {/* Section 7 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      7
                    </span>
                    Обмеження відповідальності
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p className="font-medium text-white">
                      GoodsXP не несе відповідальності за:
                    </p>
                    <ul className="space-y-2 text-muted ml-4">
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>тимчасові перебої або технічні збої в роботі сайту;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>перебої в роботі мережі Інтернет;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>дії третіх осіб, що можуть впливати на доступність сайту;</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span>можливі непрямі збитки, пов'язані з використанням сайту.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section 8 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      8
                    </span>
                    Зміна умов
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      Ми залишаємо за собою право змінювати ці Умови використання у будь-який час.
                    </p>
                    <p className="font-medium text-white">
                      Оновлена версія умов набирає чинності з моменту її публікації на сайті.
                    </p>
                    <p>
                      Рекомендуємо періодично переглядати цю сторінку.
                    </p>
                  </div>
                </div>

                {/* Section 9 */}
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                      9
                    </span>
                    Контакти
                  </h2>
                  <div className="space-y-4 text-muted leading-relaxed">
                    <p>
                      З усіх питань щодо Умов використання ви можете звернутися до нас:
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
