'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Phone, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/wishlist';
import { useState, useEffect } from 'react';
import { getAdminPagePath } from '@/lib/admin-paths';
import FlyToCartAnimation from '@/components/FlyToCartAnimation';

const navLinks = [
  { href: '/', label: 'Головна' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/delivery', label: 'Доставка' },
  { href: '/payment', label: 'Оплата' },
  { href: '/warranty', label: 'Гарантія' },
  { href: '/contacts', label: 'Контакти' },
];

export default function Header() {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const lastAddedPosition = useCartStore((state) => state.lastAddedPosition);
  const setLastAddedPosition = useCartStore((state) => state.setLastAddedPosition);
  const [showFlyAnimation, setShowFlyAnimation] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Тільки на клієнті читаємо localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Анімація додавання в кошик
  useEffect(() => {
    if (lastAddedPosition) {
      setShowFlyAnimation(true);
      const timer = setTimeout(() => {
        setShowFlyAnimation(false);
        setLastAddedPosition(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [lastAddedPosition, setLastAddedPosition]);

  const handleLogout = () => {
    // Тільки на клієнті працюємо з localStorage і location
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-purple-500/20' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity duration-200">
            <Image src="/logo.png" alt="GoodsXP — Головна" width={160} height={40} className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-light tracking-wide text-white/90 hover:text-purple-400 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            {/* ✅ Phone — visible on desktop */}
            <a
              href="tel:+380634010552"
              className="hidden xl:flex items-center gap-2 text-white/90 hover:text-purple-400 transition-colors duration-200"
              title="Зателефонувати"
            >
              <Phone size={18} strokeWidth={1.5} />
              <span className="text-sm font-light">+380 (63) 401-05-52</span>
            </a>

            {/* ✅ Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex items-center gap-2 text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              <Heart size={22} strokeWidth={1.5} />
              <span className="hidden md:inline text-sm font-light">Обране</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-red-500/30">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              <span className="hidden md:inline text-sm font-light">Кошик</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-purple-500/30">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'ADMIN' && (
                  <Link
                    href={getAdminPagePath('')}
                    className="text-sm font-light text-white/90 hover:text-purple-400 transition-colors duration-200"
                  >
                    Адмінка
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm font-light text-white/90 hover:text-purple-400 transition-colors duration-200"
                >
                  Вийти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-white/90 hover:text-purple-400 transition-colors duration-200"
              >
                <User size={22} strokeWidth={1.5} />
                <span className="hidden md:inline text-sm font-light">Увійти</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-md border-t border-purple-500/20 animate-slide-down">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-light text-white/90 hover:text-purple-400 transition-colors duration-200 py-2"
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile quick links */}
            <div className="flex gap-4 pt-4 border-t border-purple-500/10">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-muted hover:text-purple-400 transition-colors"
              >
                <Heart size={18} />
                <span>Обране{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-muted hover:text-purple-400 transition-colors"
              >
                <ShoppingCart size={18} />
                <span>Кошик{itemCount > 0 ? ` (${itemCount})` : ''}</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* ✅ Fly to cart animation */}
      {showFlyAnimation && lastAddedPosition && (
        <FlyToCartAnimation
          startX={lastAddedPosition.x}
          startY={lastAddedPosition.y}
          onComplete={() => setShowFlyAnimation(false)}
        />
      )}
    </header>
  );
}
