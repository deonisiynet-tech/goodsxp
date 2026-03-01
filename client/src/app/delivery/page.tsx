import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Truck, Clock, Package } from 'lucide-react';

const deliveryMethods = [
  {
    icon: Truck,
    title: 'Нова Пошта',
    description: "Доставка у відділення або кур'єром по всій Україні.",
    terms: '1-3 робочих дні',
    price: 'від 50 ₴',
  },
  {
    icon: Package,
    title: 'Укрпошта',
    description: 'Економна доставка до найближчого поштового відділення.',
    terms: '3-7 робочих днів',
    price: 'від 35 ₴',
  },
  {
    icon: Clock,
    title: "Кур'єрська доставка",
    description: "Доставка кур'єром прямо до дверей.",
    terms: '1-2 робочих дні',
    price: 'від 100 ₴',
  },
];

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <h1 className="section-title mb-4">Доставка</h1>
            <p className="text-muted text-lg">
              Швидка та надійна доставка по всій Україні
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {deliveryMethods.map((method, index) => (
              <div key={index} className="card p-6">
                <method.icon className="w-10 h-10 mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-medium mb-2">{method.title}</h3>
                <p className="text-muted text-sm mb-4">{method.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Термін:</span>
                    <span>{method.terms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Вартість:</span>
                    <span className="font-medium">{method.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-8">
              <h2 className="text-xl font-light mb-4">Як оформити доставку?</h2>
              <ol className="space-y-4 text-muted">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Оберіть товари та додайте їх до кошика</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Оформіть замовлення, вказавши спосіб доставки</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Очікуйте на підтвердження від менеджера</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full border border-primary flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <span>Отримайте замовлення у відділенні або кур{`'`}єром</span>
                </li>
              </ol>
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-light mb-4">Важлива інформація</h2>
              <ul className="space-y-3 text-muted">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Безкоштовна доставка від 5000 ₴</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Відправка в день замовлення при оформленні до 15:00</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Трек-номер для відстеження посилки</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Страхування вантажу включено у вартість</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Можливість огляду товару перед отриманням</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
