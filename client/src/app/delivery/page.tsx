import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Truck, Home, MapPin, Clock, CreditCard } from 'lucide-react';

function Package({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        {/* Header */}
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <h1 className="section-title mb-4">Доставка</h1>
            <p className="text-muted text-lg">
              Швидка та надійна доставка по всій Україні
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Delivery Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Нова Пошта */}
            <div className="card p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7 text-purple-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-medium mb-1">Нова Пошта</h2>
                  <p className="text-muted text-sm">
                    Доставка здійснюється по всій Україні через службу доставки Нова Пошта.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">понад 10 000+ відділень та поштоматів по Україні</span>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">доставка у відділення або поштомат</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">середній термін доставки 1–3 дні</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">Вартість доставки:</span>
                  <span className="font-medium text-purple-400">за тарифами перевізника</span>
                </div>
              </div>
            </div>

            {/* Кур'єрська доставка */}
            <div className="card p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Home className="w-7 h-7 text-purple-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-medium mb-1">Кур'єрська доставка</h2>
                  <p className="text-muted text-sm">
                    Доставка кур'єром Нової Пошти прямо до ваших дверей.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">доставка додому або в офіс</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">швидка доставка 1–3 дні</span>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-muted">можливість оплати при отриманні</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">Вартість доставки:</span>
                  <span className="font-medium text-purple-400">за тарифами перевізника</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Як оформити доставку */}
            <div className="card p-8">
              <h2 className="text-xl font-light mb-6">Як оформити доставку?</h2>
              <ol className="space-y-4">
                {[
                  { num: 1, text: 'Оберіть товари та додайте їх до кошика' },
                  { num: 2, text: 'Оформіть замовлення, вказавши спосіб доставки' },
                  { num: 3, text: 'Очікуйте на підтвердження від менеджера' },
                  { num: 4, text: "Отримайте замовлення у відділенні або кур'єром" },
                ].map((step) => (
                  <li key={step.num} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-sm font-medium text-purple-400 shrink-0">
                      {step.num}
                    </span>
                    <span className="text-muted pt-0.5">{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Важлива інформація */}
            <div className="card p-8">
              <h2 className="text-xl font-light mb-6">Важлива інформація</h2>
              <ul className="space-y-3">
                {[
                  'Безкоштовна доставка від 5000 ₴',
                  'Відправка в день замовлення при оформленні до 15:00',
                  'Трек-номер для відстеження посилки',
                  'Страхування вантажу включено у вартість',
                  'Можливість огляду товару перед отриманням',
                ].map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-purple-400 shrink-0 mt-1">•</span>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
