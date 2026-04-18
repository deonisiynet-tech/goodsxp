'use client';

import Link from 'next/link';
import { CheckCircle, ArrowLeft, Truck, Phone, Package, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderNumber from '@/components/OrderNumber';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderContent() {
  const searchParams = useSearchParams();
  const orderNum = searchParams.get('order');

  const steps = [
    { icon: Package, title: 'Замовлення прийнято', desc: 'Ми вже отримали ваше замовлення', done: true },
    { icon: Phone, title: "Менеджер зв'яжеться", desc: 'Протягом 30 хв для підтвердження', done: false },
    { icon: Truck, title: 'Відправка', desc: 'Відправимо Новою Поштою сьогодні', done: false },
    { icon: Clock, title: 'Отримання', desc: '1–3 дні до вашого відділення', done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">Замовлення успішно оформлено! 🎉</h1>
          <p className="text-muted text-lg max-w-lg mx-auto">
            Дякуємо, що обрали GoodsXP. Ми вже отримали ваше замовлення і готуємося до відправки.
          </p>
        </div>

        <div className="card p-6 mb-8 text-center border border-green-500/20">
          <p className="text-muted text-sm mb-2">Номер вашого замовлення:</p>
          <OrderNumber />
          <p className="text-muted text-xs mt-3">Збережіть цей номер для відстеження</p>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-light mb-6">Що буде далі?</h2>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? 'bg-green-500/20 border border-green-500/30' : 'bg-[#1f1f23] border border-[#26262b]'
                  }`}>
                    <Icon size={18} className={step.done ? 'text-green-400' : 'text-[#9ca3af]'} />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${step.done ? 'text-green-400' : 'text-white'}`}>{step.title}</p>
                    <p className="text-xs text-muted">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6 mb-8 border border-purple-500/10">
          <h2 className="text-lg font-light mb-4">Питання? Зв&apos;яжіться з нами:</h2>
          <div className="space-y-3">
            <a href="tel:+380634010552" className="flex items-center gap-3 text-muted hover:text-purple-400 transition-colors">
              <Phone size={18} className="text-purple-400" />
              <span>+380 (63) 401-05-52</span>
            </a>
            <a href="https://t.me/goodsxp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted hover:text-purple-400 transition-colors">
              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.293c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.93z"/>
              </svg>
              <span>Telegram @goodsxp</span>
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/catalog" className="btn-primary w-full inline-block flex items-center justify-center gap-2">
            <Package size={18} />
            Продовжити покупки
          </Link>
          <Link href="/" className="block text-center text-sm text-muted hover:text-purple-400 transition-colors">
            <ArrowLeft size={16} className="inline mr-1" />
            Повернутися на головну
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  );
}
