'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import { productsApi } from '@/lib/api';

interface SearchResult {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
}

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
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await productsApi.search(searchQuery, 8);
          setSearchResults(response.data.products);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (productId: string) => {
    router.push(`/catalog/${productId}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-wider text-primary shrink-0">
            GoodsXP
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                className="w-full bg-surfaceLight border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-secondary focus:outline-none focus:border-primary transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surfaceLight transition-colors text-left"
                      >
                        <img
                          src={product.imageUrl || '/placeholder.jpg'}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.title}</p>
                          <p className="text-xs text-muted">
                            {Number(product.price).toLocaleString('uk-UA')} ₴
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
                        setShowSearchResults(false);
                      }}
                      className="w-full text-center text-sm text-primary hover:underline"
                    >
                      Дивитися всі результати →
                    </button>
                  </div>
                </div>
              )}

              {/* No Results */}
              {showSearchResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl p-4 z-50">
                  <p className="text-sm text-muted text-center">Товари не знайдено</p>
                </div>
              )}
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-light tracking-wide text-secondary hover:text-primary transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-secondary hover:text-primary transition-colors"
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              <span className="hidden md:inline text-sm font-light">Кошик</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-background text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-sm font-light text-secondary hover:text-primary transition-colors"
                  >
                    Адмінка
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm font-light text-secondary hover:text-primary transition-colors"
                >
                  Вийти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
              >
                <User size={22} strokeWidth={1.5} />
                <span className="hidden md:inline text-sm font-light">Увійти</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-primary"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Пошук товарів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surfaceLight border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-secondary focus:outline-none focus:border-primary transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-t border-border animate-slide-down">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-light text-secondary hover:text-primary transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
