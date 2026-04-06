'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

interface FlyToCartAnimationProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

/**
 * Легка анімація "польоту" товару до кошика
 * Показує маленьку іконку кошика, що летить від кнопки до хедера
 */
export default function FlyToCartAnimation({ startX, startY, onComplete }: FlyToCartAnimationProps) {
  const [phase, setPhase] = useState<'flying' | 'done'>('flying');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: startX,
        top: startY,
        animation: 'flyToCart 0.6s ease-in-out forwards',
      }}
    >
      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
        <ShoppingCart size={16} className="text-white" />
      </div>
    </div>
  );
}
