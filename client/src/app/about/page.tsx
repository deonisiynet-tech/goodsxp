import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Target, Award, Users, Heart } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Наша місія',
    description: 'Забезпечити кожного українця доступом до сучасних технологій за справедливою ціною.',
  },
  {
    icon: Award,
    title: 'Якість',
    description: 'Пропонуємо тільки оригінальну продукцію від офіційних постачальників.',
  },
  {
    icon: Users,
    title: 'Команда',
    description: 'Професійна команда експертів готова допомогти з вибором у будь-який час.',
  },
  {
    icon: Heart,
    title: 'Турбота',
    description: 'Ми дбаємо про кожного клієнта та супроводжуємо після покупки.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <h1 className="section-title mb-4">Про нас</h1>
            <p className="text-muted text-lg">
              GoodsXP — сучасний інтернет-магазин електроніки в Україні
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Main Content */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-light mb-6 flex items-center gap-3">
              <span className="text-3xl">💎</span>
              Хто ми
            </h2>
            
            <div className="space-y-8 text-muted leading-relaxed">
              <div>
                <p className="text-lg mb-4">
                  <span className="text-primary font-medium">GoodsXP</span> — це сучасний онлайн-магазин трендових гаджетів та електроніки для української аудиторії.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                  <span>⌚</span>
                  Що ми пропонуємо
                </h3>
                <p>
                  Ми зосереджені на актуальних технологічних рішеннях: смарт-годинниках ⌚, навушниках 🎧, павербанках 🔋 та інших корисних гаджетах, які роблять щоденне життя зручнішим.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                  <span>🚀</span>
                  Наша місія
                </h3>
                <p>
                  Пропонувати якісні та перевірені товари за чесною ціною — без зайвої складності та переплат. Тільки те, що дійсно варте вашої уваги.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  Чому обирають нас
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Швидка обробка замовлень по всій Україні 📦</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Жива підтримка через менеджера 💬</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Перевірені постачальники та гарантія якості ✨</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-xl font-medium text-center text-primary">
                  Розумні гаджети для сучасного життя 🚀
                </p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value, index) => (
              <div key={index} className="card p-6 text-center">
                <value.icon className="w-12 h-12 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-medium mb-2">{value.title}</h3>
                <p className="text-muted text-sm">{value.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="card p-8 bg-surfaceLight text-center">
            <h2 className="text-2xl font-light mb-4">Приєднуйтесь до нас</h2>
            <p className="text-muted mb-6 max-w-xl mx-auto">
              Підпишіться на нашу розсилку та отримуйте інформацію про новинки, 
              акції та спеціальні пропозиції.
            </p>
            <a href="/contacts" className="btn-primary inline-block">
              Зв'язатися з нами
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
