'use client';

import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemCount } =
    useCartStore();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-3xl font-light mb-4">Кошик порожній</h1>
            <p className="text-muted mb-8">
              Додай товари з каталогу
            </p>
            <Link href="/catalog" className="btn-primary inline-flex items-center gap-2">
              Перейти до каталогу
              <ArrowRight size={20} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-light mb-8">Кошик</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="card p-4 flex gap-4 items-center"
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-surfaceLight">
                  <img
                    src={item.imageUrl || '/placeholder.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />
                </div>

                <div className="flex-1">
                  <Link
                    href={`/catalog/${item.productId}`}
                    className="font-medium hover:text-secondary transition-colors"
                  >
                    {item.title}
                  </Link>
                  <p className="text-muted text-sm">
                    {item.price.toLocaleString('uk-UA')} ₴
                  </p>
                </div>

                <div className="flex items-center border border-border">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="px-3 py-2 hover:bg-surfaceLight transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-3 py-2 hover:bg-surfaceLight transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="font-medium">
                    {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-muted hover:text-primary transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-light mb-6">Підсумок</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted">
                  <span>Товари ({getItemCount()} шт.):</span>
                  <span>{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Доставка:</span>
                  <span className="text-green-500">Безкоштовно</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-medium">
                  <span>Разом:</span>
                  <span>{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-primary w-full"
              >
                Оформити замовлення
              </button>

              <Link
                href="/catalog"
                className="block text-center mt-4 text-sm hover:text-secondary transition-colors"
              >
                Продовжити покупки
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
