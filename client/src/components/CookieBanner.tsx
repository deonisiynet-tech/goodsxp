'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Перевірка на SSR
    if (typeof window === 'undefined') return;

    // Check if user already made a choice
    const consent = localStorage.getItem('cookie-consent');

    if (!consent) {
      // Show banner with delay for smooth entrance
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookie-consent', 'accepted');
    hideBanner();
  };

  const handleReject = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cookie-consent', 'rejected');
    hideBanner();
  };

  const hideBanner = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 transition-all duration-300 ${
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 opacity-50" />

          {/* Content */}
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Icon & Text */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <Cookie size={24} className="text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted leading-relaxed">
                      Ми використовуємо cookie для забезпечення коректної роботи сайту, аналітики та покращення сервісу.
                      Детальніше у нашій{' '}
                      <Link
                        href="/privacy"
                        className="text-primary hover:text-secondary underline underline-offset-2 transition-colors"
                      >
                        Політиці конфіденційності
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button
                  onClick={handleReject}
                  className="px-6 py-3 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/10 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                >
                  Відхилити необов'язкові
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-400 text-background font-semibold hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 whitespace-nowrap"
                >
                  Прийняти всі
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
