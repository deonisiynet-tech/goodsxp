'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Shield, 
  RefreshCw, 
  Package, 
  Headphones, 
  CheckCircle, 
  Clock, 
  MessageCircle,
  ArrowRight,
  ChevronDown,
  Truck,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

// ===== ACCORDION COMPONENT =====
function AccordionItem({ 
  title, 
  children, 
  isOpen, 
  onClick 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left bg-surface/50 hover:bg-surface transition-colors"
      >
        <span className="font-medium text-lg">{title}</span>
        <ChevronDown 
          size={20} 
          className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 bg-surfaceLight/50 text-muted leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===== TIMELINE ITEM COMPONENT =====
function TimelineItem({ 
  number, 
  title, 
  description, 
  icon: Icon,
  isLast 
}: { 
  number: number; 
  title: string; 
  description: string; 
  icon: any;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-6 pb-8">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
          <Icon size={24} className="text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-2">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">
            {number}
          </span>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-muted leading-relaxed">{description}</p>
      </div>

      {/* Connection Line */}
      {!isLast && (
        <div className="absolute left-7 top-14 w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent" />
      )}
    </div>
  );
}

// ===== ADVANTAGE CARD COMPONENT =====
function AdvantageCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <div className="group relative p-6 rounded-2xl bg-surface/50 border border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={28} className="text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function WarrantyPage() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const accordionData = [
    {
      title: 'Що покриває гарантія',
      content: (
        <ul className="space-y-3">
          <li className="flex gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Виробничі дефекти та брак</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Несправності, що виникли з вини виробника</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Відмова роботи основних функцій товару</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <span>Проблеми з акумулятором (для портативних пристроїв)</span>
          </li>
        </ul>
      ),
    },
    {
      title: 'Що не покриває гарантія',
      content: (
        <ul className="space-y-3">
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-0.5 bg-red-500" />
            </div>
            <span>Пошкодження від неправильного використання</span>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-0.5 bg-red-500" />
            </div>
            <span>Механічні пошкодження, удари, падіння</span>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-0.5 bg-red-500" />
            </div>
            <span>Пошкодження від вологи, пилу або екстремальних температур</span>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-0.5 bg-red-500" />
            </div>
            <span>Втручання в конструкцію товару (розбирання, модифікації)</span>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-3 h-0.5 bg-red-500" />
            </div>
            <span>Природне зношування витратних матеріалів</span>
          </li>
        </ul>
      ),
    },
    {
      title: 'Умови сервісного обслуговування',
      content: (
        <div className="space-y-4">
          <p>Для отримання гарантійного обслуговування необхідно:</p>
          <ul className="space-y-2">
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Наявність заповненого гарантійного талона</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Чек або інше підтвердження покупки</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Оригінальна упаковка та комплектація</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">•</span>
              <span>Відсутність слідів самостійного ремонту</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Термін гарантії по категоріях',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Смартфони</span>
            <span className="text-primary font-medium">12 місяців</span>
          </div>
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Ноутбуки</span>
            <span className="text-primary font-medium">12-24 місяці</span>
          </div>
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Планшети</span>
            <span className="text-primary font-medium">12 місяців</span>
          </div>
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Навушники</span>
            <span className="text-primary font-medium">12 місяців</span>
          </div>
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Годинники</span>
            <span className="text-primary font-medium">12 місяців</span>
          </div>
          <div className="flex justify-between p-3 bg-surface rounded-lg">
            <span>Аксесуари</span>
            <span className="text-primary font-medium">6-12 місяців</span>
          </div>
        </div>
      ),
    },
  ];

  const timelineSteps = [
    {
      number: 1,
      title: 'Звернення в підтримку',
      description: "Зв'яжіться з нашою службою підтримки через форму на сайті, email або телефон. Опишіть проблему з товаром.",
      icon: MessageCircle,
    },
    {
      number: 2,
      title: 'Відправка товару',
      description: 'Отримайте інструкції з відправки. Відправте товар новою поштою за наш рахунок. Ми надамо трек-номер.',
      icon: Truck,
    },
    {
      number: 3,
      title: 'Перевірка сервісом',
      description: 'Наш сервісний центр проведе діагностику (1-3 дні). Ви отримаєте звіт про стан товару та подальші кроки.',
      icon: Clock,
    },
    {
      number: 4,
      title: 'Повернення коштів',
      description: 'Після підтвердження гарантійного випадку ми повернемо кошти або замінимо товар протягом 5-10 днів.',
      icon: CreditCard,
    },
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
                Гарантія та повернення
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Ми гарантуємо якість кожного товару та чесні умови обміну і повернення. 
                Ваше задоволення — наш пріоритет.
              </p>
            </div>
          </div>
        </section>

        {/* ===== ADVANTAGE CARDS ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <AdvantageCard
                icon={RefreshCw}
                title="14 днів на повернення"
                description="Поверніть або обміняйте товар протягом 14 днів без зайвих запитань."
              />
              <AdvantageCard
                icon={Shield}
                title="Гарантія якості"
                description="Ми пропонуємо тільки нові та перевірені товари. Перед відправкою кожне замовлення перевіряється, щоб ви отримали якісний продукт."
              />
              <AdvantageCard
                icon={Headphones}
                title="Підтримка 24/7"
                description="Наша команда готова допомогти з будь-якими питаннями щодо гарантії."
              />
            </div>
          </div>
        </section>

        {/* ===== WARRANTY CONDITIONS (ACCORDION) ===== */}
        <section className="py-16 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Гарантійні умови</h2>
                <p className="text-muted text-lg">
                  Детальна інформація про те, що покриває гарантія
                </p>
              </div>

              <div className="space-y-4">
                {accordionData.map((item, index) => (
                  <AccordionItem
                    key={index}
                    title={item.title}
                    isOpen={openAccordion === index}
                    onClick={() => setOpenAccordion(openAccordion === index ? null : index)}
                  >
                    {item.content}
                  </AccordionItem>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== RETURN TIMELINE ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Повернення та обмін</h2>
                <p className="text-muted text-lg">
                  Простий процес з 4 кроків для вашого зручності
                </p>
              </div>

              <div className="relative">
                {timelineSteps.map((step, index) => (
                  <TimelineItem
                    key={index}
                    number={step.number}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    isLast={index === timelineSteps.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST STATS ===== */}
        <section className="py-16 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Нам довіряють</h2>
              <p className="text-muted text-lg">
                Статистика, яка говорить сама за себе
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
                  98%
                </div>
                <p className="text-muted">успішних гарантійних випадків</p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <p className="text-muted">швидка підтримка клієнтів</p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
                  100%
                </div>
                <p className="text-muted">надійний сервіс</p>
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
                  Маєте питання щодо гарантії?
                </h2>
                <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                  Наша команда підтримки готова відповісти на всі ваші запитання 
                  та допомогти з гарантійним обслуговуванням.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/contacts" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
                  >
                    <MessageCircle size={20} />
                    Написати в підтримку
                  </Link>
                  <Link 
                    href="/catalog" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-primary/30 text-primary font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:bg-primary/10 hover:scale-105"
                  >
                    Перейти до каталогу
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
