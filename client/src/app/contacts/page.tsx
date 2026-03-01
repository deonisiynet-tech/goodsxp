'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  Send,
  ArrowRight,
  CheckCircle,
  Zap,
  Headphones,
  Shield
} from 'lucide-react';
import Link from 'next/link';

// ===== CONTACT CARD COMPONENT =====
function ContactCard({ 
  icon: Icon,
  title,
  value,
  buttonText,
  buttonHref,
  buttonOnClick,
  gradient,
  delay
}: { 
  icon: any;
  title: string;
  value: string;
  buttonText: string;
  buttonHref?: string;
  buttonOnClick?: () => void;
  gradient: string;
  delay: string;
}) {
  return (
    <div 
      className={`group relative p-8 rounded-3xl bg-surface/50 border border-border overflow-hidden transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:-translate-y-2 animate-fade-in ${delay}`}
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon size={32} className="text-primary" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-2">{title}</h3>

        {/* Value */}
        <p className="text-muted text-lg mb-6 flex-1">{value}</p>

        {/* Button */}
        {buttonText && (
          buttonHref ? (
            <Link
              href={buttonHref}
              target={buttonHref.startsWith('http') ? '_blank' : undefined}
              rel={buttonHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
            >
              {buttonText}
              <ArrowRight size={18} />
            </Link>
          ) : (
            <button
              onClick={buttonOnClick}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
            >
              {buttonText}
              <ArrowRight size={18} />
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ===== TRUST ITEM COMPONENT =====
function TrustItem({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: any; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-border hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
        <Icon size={24} className="text-primary" strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-muted text-sm">{description}</p>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@goodsxp.store');
    alert('Email скопійовано в буфер обміну!');
  };

  const contactCards = [
    {
      icon: MessageCircle,
      title: 'Telegram',
      value: '@goodsxp',
      buttonText: 'Написати в Telegram',
      buttonHref: 'https://t.me/goodsxp',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      delay: '',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'support@goodsxp.store',
      buttonText: 'Написати на Email',
      buttonHref: 'mailto:support@goodsxp.store',
      gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
      delay: 'md:delay-200',
    },
    {
      icon: Clock,
      title: 'Графік роботи',
      value: 'Пн–Сб: 9:00 – 20:00',
      buttonText: 'Написати прямо зараз',
      buttonHref: 'https://t.me/goodsxp',
      gradient: 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10',
      delay: 'md:delay-400',
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
                <Headphones size={40} className="text-primary" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
                Контакти
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted leading-relaxed animate-slide-up delay-200">
                Ми завжди на зв'язку та готові допомогти вам
              </p>
            </div>
          </div>
        </section>

        {/* ===== CONTACT CARDS ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {contactCards.map((card, index) => (
                <ContactCard
                  key={index}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  buttonText={card.buttonText}
                  buttonHref={card.buttonHref}
                  gradient={card.gradient}
                  delay={card.delay}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== TRUST BLOCK ===== */}
        <section className="py-16 bg-surface/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Чому нам можна довіряти?
                </h2>
                <p className="text-muted text-lg">
                  Ми цінуємо кожного клієнта та гарантуємо якісний сервіс
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrustItem
                  icon={Zap}
                  title="Швидка відповідь"
                  description="Відповідаємо на всі запитання протягом робочого часу. Середній час відповіді — 30 хвилин."
                />
                <TrustItem
                  icon={MessageCircle}
                  title="Прямий зв'язок з менеджером"
                  description="Ніяких ботів та автовідповідей. Спілкуйтесь з реальними людьми."
                />
                <TrustItem
                  icon={Headphones}
                  title="Підтримка до та після покупки"
                  description="Допоможемо з вибором товару та супроводжуємо після отримання замовлення."
                />
                <TrustItem
                  icon={Shield}
                  title="Гарантія конфіденційності"
                  description="Ваші персональні дані під надійним захистом. Не передаємо третім особам."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ QUICK LINKS ===== */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Корисна інформація
                </h2>
                <p className="text-muted text-lg">
                  Відповіді на популярні запитання
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link 
                  href="/delivery"
                  className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">Доставка</h3>
                    <ArrowRight size={20} className="text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                  <p className="text-muted text-sm">
                    Інформація про способи доставки, терміни та вартість
                  </p>
                </Link>

                <Link 
                  href="/payment"
                  className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">Оплата</h3>
                    <ArrowRight size={20} className="text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                  <p className="text-muted text-sm">
                    Способи оплати, безпека платежів та гарантії
                  </p>
                </Link>

                <Link 
                  href="/warranty"
                  className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">Гарантія</h3>
                    <ArrowRight size={20} className="text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                  <p className="text-muted text-sm">
                    Гарантійні умови, повернення та обмін товару
                  </p>
                </Link>

                <Link 
                  href="/catalog"
                  className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">Каталог</h3>
                    <ArrowRight size={20} className="text-primary group-hover:translate-x-2 transition-transform" />
                  </div>
                  <p className="text-muted text-sm">
                    Весь асортимент товарів з цінами та описом
                  </p>
                </Link>
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
                  Маєте питання?
                </h2>
                <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
                  Наші менеджери готові відповісти на всі ваші запитання 
                  та допомогти з вибором товару.
                </p>
                <Link 
                  href="https://t.me/goodsxp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-400 text-background font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
                >
                  <MessageCircle size={20} />
                  Написати в Telegram
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
