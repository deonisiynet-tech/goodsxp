'use client';

import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

interface FreeShippingProgressProps {
  cartSubtotal: number;
}

export default function FreeShippingProgress({ cartSubtotal }: FreeShippingProgressProps) {
  const isFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD;
  const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const progressPercent = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (isFreeShipping) {
    return (
      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 shadow-lg shadow-green-500/5">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🎉</span>
          <p className="text-base font-semibold text-green-400">
            Вітаємо! Доставка для цього замовлення безкоштовна
          </p>
          <span className="text-2xl">🚚</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">До безкоштовної доставки залишилось:</span>
          <span className="font-semibold text-purple-400">{amountRemaining.toLocaleString('uk-UA')} ₴</span>
        </div>

        <div className="relative w-full h-3 bg-surfaceLight rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-muted text-center">
          Додайте товарів ще на {amountRemaining.toLocaleString('uk-UA')} ₴ для безкоштовної доставки 🚚
        </p>
      </div>
    </div>
  );
}
