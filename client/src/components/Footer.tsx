import Link from 'next/link';

const footerLinks = {
  shop: [
    { href: '/catalog', label: 'Каталог' },
    { href: '/delivery', label: 'Доставка' },
    { href: '/payment', label: 'Оплата' },
    { href: '/warranty', label: 'Гарантія' },
    { href: '/return-policy', label: 'Повернення' },
  ],
  info: [
    { href: '/about', label: 'Про нас' },
    { href: '/contacts', label: 'Контакти' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold tracking-wider text-primary mb-4 block">
              GoodsXP
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              Сучасна електроніка для твого життя. Якість, якій довіряють.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4">Інтернет-магазин</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4">Інформація</h4>
            <ul className="space-y-3">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-medium tracking-wide mb-4">Контакти</h4>
            <ul className="space-y-3 text-muted text-sm">
              <li>
                <a href="https://t.me/goodsxp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Tg @goodsxp
                </a>
              </li>
              <li>
                <a href="mailto:support@goodsxp.store" className="hover:text-primary transition-colors">
                  support@goodsxp.store
                </a>
              </li>
              <li>Пн-Пт: 9:00 - 20:00</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} GoodsXP. Всі права захищено.
          </p>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Політика конфіденційності
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Умови використання
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
