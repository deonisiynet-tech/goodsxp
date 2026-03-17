'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  CreditCard, 
  Package, 
  Shield, 
  CheckCircle, 
  Phone, 
  FileText, 
  Wallet,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// ===== PAYMENT METHOD CARD COMPONENT =====
function PaymentMethodCard({ 
  icon: Icon,
  title,
  description,
  steps,
  badge,
  badgeColor,
  delay
}: { 
  icon: any;
  title: string;
  description: string;
  steps: string[];
  badge: string;
  badgeColor: string;
  delay: string;
}) {
  return (
    <div 
      className={`group relative p-8 rounded-3xl bg-surface/50 border border-border overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:-translate-y-2 animate-fade-in ${delay}`}
    >
      {/* Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        {/* Icon & Badge */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon size={32} className="text-primary" strokeWidth={1.5} />
          </div>
          <span className={`px-4 py-2 rounded-full text-xs font-semibold ${badgeColor}`}>
            {badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4">{title}</h3>

        {/* Description */}
        <p className="text-muted leading-relaxed mb-6">{description}</p>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-purple-400 flex-shrink-0 mt-1.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <span className="text-muted text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== TIMELINE STEP COMPONENT =====
function TimelineStep({ 
  number, 
  title, 
  icon: Icon,
  isLast 
}: { 
  number: number; 
  title: string; 
  icon: any;
  isLast: boolean;
}) {
  return (
    <div className="relative flex items-center gap-4">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
          <Icon size={20} className="text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <div className="flex-1">
        <span className="font-medium">{title}</span>
      </div>

      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent hidden md:block" />
      )}
    </div>
  );
}

export default function PaymentPage() {
  const paymentMethods = [
    {
      icon: CreditCard,
      title: 'Оплата банківською карткою онлайн через менеджера',
      description: 'Безпечна оплата банківським переказом після узгодження з менеджером.',
      steps: [
        'Після оформлення замовлення з вами зв\'яжеться менеджер',
        'Ви отримуєте реквізити для оплати',
        'Оплата здійснюється банківським переказом',
        'Після підтвердження оплати товар відправляється',
      ],
      badge: 'Безпечно',
      badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30',
      delay: '',
    },
    {
      icon: Package,
      title: 'Оплата при отриманні у відділенні',
      description: 'Зручна оплата післяплатою у відділенні Нової Пошти.',
      steps: [
        'Ви оплачуєте товар при отриманні',
        'Перевірка товару перед оплатою',
        'Комісія перевізника стягується окремо',
        'Ніякої передоплати не потрібно',
      ],
      badge: 'Без передоплати',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      delay: 'md:delay-200',
    },
  ];

  const timelineSteps = [
    { number: 1, title: 'Оформлення замовлення', icon: FileText },
    { number: 2, title: 'Уточнення деталей', icon: CheckCircle },
    { number: 3, title: 'Оплата', icon: Wallet },
    { number: 4, title: 'Відправка товару', icon: Package },
  ];

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
                Оплата
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Зручні та безпечні способи оплати вашого замовлення
              </p>
            </div>
          </div>
        </section>

        {/* ===== PAYMENT METHODS ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {paymentMethods.map((method, index) => (
                <PaymentMethodCard
                  key={index}
                  icon={method.icon}
                  title={method.title}
                  description={method.description}
                  steps={method.steps}
                  badge={method.badge}
                  badgeColor={method.badgeColor}
                  delay={method.delay}
                />
              ))}
            </div>

            {/* Coming Soon Card */}
            <div className="max-w-6xl mx-auto mt-8">
              <div className="group relative p-8 rounded-3xl bg-surface/30 border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/30">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Wallet size={32} className="text-primary/70" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-muted">Apple Pay / Google Pay</h3>
                      <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <Sparkles size={12} />
                        Скоро
                      </span>
                    </div>
                    <p className="text-muted/70 leading-relaxed">
                      Швидка та зручна оплата з вашого смартфона. 
                      Безконтактна оплата в один клік.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECURITY BLOCK ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden bg-surface/50 border border-border p-8 md:p-12">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-xl" />
                
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
                      <Shield size={32} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Гарантія безпеки</h2>
                    <p className="text-muted">
                      Ваші платежі під надійним захистом
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield size={24} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-muted">
                        Ми не зберігаємо дані банківських карт
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CheckCircle size={24} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-muted">
                        Працюємо тільки з перевіреними банками
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Phone size={24} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-muted">
                        Всі платежі підтверджуються менеджером
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PAYMENT PROCESS TIMELINE ===== */}
        <section className="py-16 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Процес оплати</h2>
                <p className="text-muted text-lg">
                  Простий і прозорий процес у 4 кроки
                </p>
              </div>

              <div className="relative">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-2">
                  {timelineSteps.map((step, index) => (
                    <TimelineStep
                      key={index}
                      number={step.number}
                      title={step.title}
                      icon={step.icon}
                      isLast={index === timelineSteps.length - 1}
                    />
                  ))}
                </div>

                {/* Connection Line Desktop */}
                <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10 py-16 px-8 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Готові оформити замовлення?
                </h2>
                <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                  Обирайте товари в каталозі та оформлюйте замовлення 
                  зручним для вас способом.
                </p>
                <Link 
                  href="/catalog" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
                >
                  Перейти до каталогу
                  <ArrowRight size={20} />
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
