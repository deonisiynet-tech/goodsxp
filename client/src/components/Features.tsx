'use client';

import { Truck, Shield, Headphones, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Швидка доставка',
    description: 'Відправляємо в день замовлення. Доставка по Україні 1-3 дні.',
  },
  {
    icon: Shield,
    title: 'Гарантія якості',
    description: 'Офіційна гарантія на всі товари від 12 до 36 місяців.',
  },
  {
    icon: Headphones,
    title: 'Підтримка 24/7',
    description: 'Допоможемо з вибором та відповідимо на будь-які запитання.',
  },
  {
    icon: CreditCard,
    title: 'Зручна оплата',
    description: 'Оплата при отриманні або онлайн на сайті.',
  },
];

export default function Features() {
  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 border border-border hover:border-primary transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon className="w-10 h-10 mb-4 text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
              <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
