import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const footerLinks = {
  shop: [
    { href: '/catalog', label: 'Каталог' },
    { href: '/delivery', label: 'Доставка' },
    { href: '/payment', label: 'Оплата' },
    { href: '/warranty', label: 'Гарантія' },
  ],
  info: [
    { href: '/about', label: 'Про нас' },
    { href: '/contacts', label: 'Контакти' },
    { href: '/privacy', label: 'Політика конфіденційності' },
    { href: '/terms', label: 'Умови використання' },
  ],
};

// ✅ Довірчі елементи
const trustBadges = [
  { icon: ShieldCheck, text: 'Безпечна оплата' },
  { icon: Truck, text: 'Доставка 1–3 дні' },
  { icon: RotateCcw, text: 'Повернення 14 днів' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#0d0d10] via-[#0a0a0e] to-[#08080c] border-t border-purple-500/20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-8 border-b border-purple-500/10">
          {trustBadges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Icon size={20} className="text-purple-400" />
              </div>
              <span className="text-white font-medium text-sm">{text}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-2 hover:opacity-80 transition-opacity">
              <Image src="/logo-footer.png" alt="GoodsXP — Головна" width={248} height={62} className="w-auto max-h-[48px] sm:max-h-[56px] md:max-h-[62px]" />
            </Link>
            <p className="text-muted text-sm leading-relaxed mb-3">
              Сучасна електроніка для твого життя. Якість, якій довіряють.
            </p>

            {/* ✅ Контакти з іконками */}
            <div className="space-y-2.5">
              <a
                href="tel:+380634010552"
                className="flex items-center gap-2 text-muted text-sm hover:text-purple-300 transition-colors"
              >
                <Phone size={16} className="text-purple-400 shrink-0" />
                <span>+380 (63) 401-05-52</span>
              </a>
              <a
                href="https://t.me/goodsxp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted text-sm hover:text-purple-300 transition-colors"
              >
                <svg className="w-4 h-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.293c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.93z"/>
                </svg>
                <span>@goodsxp</span>
              </a>
              <a
                href="mailto:support@goodsxp.store"
                className="flex items-center gap-2 text-muted text-sm hover:text-purple-300 transition-colors"
              >
                <Mail size={16} className="text-purple-400 shrink-0" />
                <span>support@goodsxp.store</span>
              </a>
              <div className="flex items-center gap-2 text-muted text-sm">
                <Clock size={16} className="text-purple-400 shrink-0" />
                <span>ПН – НД (9:00 – 20:00)</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4 text-purple-400/80">Інтернет-магазин</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-purple-300 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4 text-purple-400/80">Інформація</h4>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-purple-300 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ✅ Оплата та Безпека */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4 text-purple-400/80">Оплата</h4>
            <div className="space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                Оплата при отриманні або онлайн через менеджера
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} GoodsXP. Всі права захищено.
          </p>
          <p className="text-muted text-xs">
            Зроблено з ❤️ в Україні
          </p>
        </div>
      </div>
    </footer>
  );
}
