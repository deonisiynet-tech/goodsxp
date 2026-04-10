'use client';

import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/products-api';
import { normalizeImageUrl } from '@/lib/image-utils';

interface CartItemWithSlug {
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export default function CartClient() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemCount, clearCart } = useCartStore();
  const [itemSlugs, setItemSlugs] = useState<Record<string, string>>({});

  // Fetch sl for cart items — batch request (1 замість N)
  useEffect(() => {
    const fetchSlugs = async () => {
      if (items.length === 0) return;
      try {
        const ids = items.map(item => item.productId);
        const response = await productsApi.getBatch(ids);
        const slugs: Record<string, string> = {};
        for (const product of response.products) {
          slugs[product.id] = product.slug;
        }
        setItemSlugs(slugs);
      } catch {
        const slugs: Record<string, string> = {};
        for (const item of items) {
          slugs[item.productId] = item.productId;
        }
        setItemSlugs(slugs);
      }
    };
    fetchSlugs();
  }, [items]);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShoppingCart size={40} className="text-purple-400" />
            </div>
            <h1 className="text-3xl font-light mb-4">Кошик порожній</h1>
            <p className="text-muted mb-8">
              Додай товари з каталогу, щоб оформити замовлення
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
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light flex items-center gap-3">
            <ShoppingCart size={28} className="text-purple-400" />
            Кошик
            <span className="text-lg text-muted font-normal">({getItemCount()} товарів)</span>
          </h1>
          <button
            onClick={() => { clearCart(); }}
            className="text-sm text-muted hover:text-red-400 transition-colors"
          >
            Очистити кошик
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const slug = itemSlugs[item.productId] || item.productId;
              return (
                <div
                  key={item.productId}
                  className="card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <Link href={`/catalog/${slug}`} className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl bg-surfaceLight relative">
                    <Image
                      src={normalizeImageUrl(item.imageUrl)}
                      alt={item.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/catalog/${slug}`}
                      className="font-medium hover:text-purple-400 transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <p className="text-muted text-sm mt-1">
                      {item.price.toLocaleString('uk-UA')} ₴ / шт.
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-purple-500/20 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-2 hover:bg-purple-500/10 transition-colors text-muted hover:text-white"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-white font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-2 hover:bg-purple-500/10 transition-colors text-muted hover:text-white"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-white">
                        {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-muted hover:text-red-400 transition-colors"
                      title="Видалити"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                <Package size={20} className="text-purple-400" />
                Твоє замовлення
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted text-sm">
                  <span>Товари ({getItemCount()} шт.):</span>
                  <span>{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
                <div className="flex justify-between text-muted text-sm">
                  <span>Доставка:</span>
                  <span className="text-purple-400">за тарифом НП</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-medium">
                  <span>Разом:</span>
                  <span className="text-xl font-bold text-purple-400">
                    {getTotal().toLocaleString('uk-UA')} ₴
                  </span>
                </div>
              </div>

              {getTotal() < 5000 && (
                <div className="mb-4 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                  <p className="text-xs text-muted leading-relaxed">
                    💡 До безкоштовної доставки ще {(5000 - getTotal()).toLocaleString('uk-UA')} ₴
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Оформити замовлення
                <ArrowRight size={18} />
              </button>

              <Link
                href="/catalog"
                className="block text-center mt-4 text-sm text-muted hover:text-purple-400 transition-colors"
              >
                ← Продовжити покупки
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
