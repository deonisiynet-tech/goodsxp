'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { ShoppingCart, X, ArrowRight } from 'lucide-react';

/**
 * Popup при поверненні на сайт — нагадує про товар у кошику
 * З'являється через 5 секунд якщо є товари в кошику і користувач на головній
 */
export default function CartResumePopup() {
  const { items, getTotal } = useCartStore();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if no items or already dismissed
    if (items.length === 0) return;

    // Check if user already interacted with this popup
    const dismissedAt = sessionStorage.getItem('cart_resume_dismissed');
    if (dismissedAt) return;

    // Only show on homepage
    if (typeof window !== 'undefined' && window.location.pathname !== '/') return;

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [items.length]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('cart_resume_dismissed', Date.now().toString());
  };

  if (!show || items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-50 animate-slide-up max-w-xs">
      <div className="bg-[#18181c]/95 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 shadow-2xl shadow-purple-500/10">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-[#9ca3af] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-purple-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              У вас {items.length} товар у кошику
            </p>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {getTotal().toLocaleString('uk-UA')} ₴ — оформіть замовлення
            </p>
          </div>
        </div>

        <Link
          href="/cart"
          className="btn-primary w-full text-sm py-3 min-h-[44px] flex items-center justify-center gap-2"
          onClick={handleDismiss}
        >
          Перейти до кошика
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
