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
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 transition-transform duration-200 hover:scale-105">
            <img
              src="/logo.png"
              alt="GoodsXP — Головна"
              className="h-12 sm:h-16 md:h-20 lg:h-28 w-auto"
            />
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
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 shrink-0">
            {/* Phone — desktop only */}
            <a
              href="tel:+380634010552"
              className="hidden xl:flex items-center gap-2 text-white/90 hover:text-purple-400 transition-colors duration-200"
              title="Зателефонувати"
            >
              <Phone size={18} strokeWidth={1.5} />
              <span className="text-sm font-light">+380 (63) 401-05-52</span>
            </a>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              <Heart size={22} strokeWidth={1.5} />
              <span className="hidden md:inline text-sm font-light ml-1">Обране</span>
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-red-500/30">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              <span className="hidden md:inline text-sm font-light ml-1">Кошик</span>
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-purple-500/30">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <Link
                    href={getAdminPagePath('')}
                    className="hidden md:inline text-sm font-light text-white/90 hover:text-purple-400 transition-colors duration-200"
                  >
                    Адмінка
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] text-sm font-light text-white/90 hover:text-purple-400 transition-colors duration-200"
                >
                  <span className="hidden md:inline">Вийти</span>
                  <User size={20} className="md:hidden" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-white/90 hover:text-purple-400 transition-colors duration-200"
              >
                <User size={22} strokeWidth={1.5} />
                <span className="hidden md:inline text-sm font-light ml-1">Увійти</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-white/90 hover:text-purple-400 transition-colors duration-200"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-md border-t border-purple-500/20 animate-slide-down">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-light text-white/90 hover:text-purple-400 transition-colors duration-200 py-3 min-h-[48px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
            {/* Mobile quick links */}
            <div className="flex flex-col gap-1 pt-4 mt-2 border-t border-purple-500/10">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-muted hover:text-purple-400 transition-colors py-3 min-h-[48px]"
              >
                <Heart size={20} />
                <span>Обране{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
              </Link>
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-muted hover:text-purple-400 transition-colors py-3 min-h-[48px]"
              >
                <ShoppingCart size={20} />
                <span>Кошик{itemCount > 0 ? ` (${itemCount})` : ''}</span>
              </Link>
              <a
                href="tel:+380634010552"
                className="flex items-center gap-3 text-muted hover:text-purple-400 transition-colors py-3 min-h-[48px]"
              >
                <Phone size={20} />
                <span>+380 (63) 401-05-52</span>
              </a>
            </div>
          </nav>
        </div>
      )}

      {/* Fly to cart animation */}
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
