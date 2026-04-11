'use client';

import { useRouter } from 'next/navigation';
import { normalizeImageUrl } from '@/lib/image-utils';
import Image from 'next/image';
import { ShoppingCart, ArrowRight, X } from 'lucide-react';

interface BuyPopupProps {
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  variantOptions?: { name: string; value: string }[];
  onClose: () => void;
}

export default function BuyPopup({
  title,
  price,
  imageUrl,
  quantity,
  variantOptions,
  onClose,
}: BuyPopupProps) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-sm" />

      {/* Popup */}
      <div
        className="relative bg-[#18181c] border border-[#26262b] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-0 sm:mx-4 shadow-2xl animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-white transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Success icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShoppingCart size={20} className="text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Товар додано до кошика</h3>
          </div>

          {/* Product info */}
          <div className="flex gap-4 p-4 bg-[#1f1f23] rounded-xl mb-6">
            {/* Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#26262b] relative">
              {imageUrl ? (
                <Image
                  src={normalizeImageUrl(imageUrl)}
                  alt={title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#4a4a52] text-xs">
                  Н/д
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">{title}</h4>
              {variantOptions && variantOptions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {variantOptions.map((opt, i) => (
                    <span key={i} className="text-xs text-[#9ca3af]">
                      {opt.name}: {opt.value}
                      {i < variantOptions.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-white">
                  {Number(price).toLocaleString('uk-UA')} ₴
                </span>
                <span className="text-xs text-[#9ca3af]">× {quantity} шт.</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
            >
              Оформити замовлення
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => {
                onClose();
                router.push('/cart');
              }}
              className="w-full py-3 text-sm text-[#9ca3af] hover:text-white transition-colors border border-[#26262b] rounded-xl hover:border-purple-500/50"
            >
              Перейти до кошика
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-sm text-[#6366f1] hover:text-[#818cf8] transition-colors"
            >
              Продовжити покупки
            </button>
          </div>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
