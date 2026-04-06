'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * Кнопка "Вгору" — з'являється після скролу 400px
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center hover:bg-purple-400 transition-all hover:scale-110 animate-fade-in"
      aria-label="Прокрутити вгору"
    >
      <ChevronUp size={24} />
    </button>
  );
}
