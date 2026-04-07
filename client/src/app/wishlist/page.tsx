'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/lib/wishlist';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleMoveToCart = (item: any) => {
    addItem({
      productId: item.productId,
      title: item.title,
      price: item.price,
      imageUrl: item.imageUrl || undefined,
    });
    removeItem(item.productId);
    toast.success('Переміщено до кошика');
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      addItem({
        productId: item.productId,
        title: item.title,
        price: item.price,
        imageUrl: item.imageUrl || undefined,
      });
    });
    clearWishlist();
    toast.success(`Усі товари (${items.length}) переміщено до кошика`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Heart size={40} className="text-red-400" />
            </div>
            <h1 className="text-3xl font-light mb-4">Обране порожнє</h1>
            <p className="text-muted mb-8">
              Додавайте товари до обраного, щоб порівнювати та не загубити
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
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light flex items-center gap-3">
            <Heart size={28} className="text-red-400" />
            Обране
            <span className="text-lg text-muted font-normal">({items.length})</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMoveAllToCart}
              className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5"
            >
              <ShoppingCart size={16} />
              Все в кошик
            </button>
            {confirmClear ? (
              <button
                onClick={() => { clearWishlist(); setConfirmClear(false); toast.success('Обране очищено'); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2"
              >
                Точно видалити?
              </button>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-sm text-muted hover:text-red-400 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.productId} className="card p-4 group">
              <Link href={`/catalog/${item.slug}`} className="block">
                <div className="aspect-square overflow-hidden bg-[#1f1f23] rounded-xl mb-4">
                  <img
                    src={item.imageUrl || '/placeholder.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                    }}
                  />
                </div>
              </Link>
              <Link href={`/catalog/${item.slug}`} className="block">
                <h3 className="font-medium text-sm text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors">
                  {item.title}
                </h3>
              </Link>
              <p className="text-lg font-bold text-white mb-4">
                {item.price.toLocaleString('uk-UA')} ₴
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMoveToCart(item)}
                  className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  В кошик
                </button>
                <button
                  onClick={() => { removeItem(item.productId); toast.success('Видалено з обраного'); }}
                  className="p-2.5 border border-[#26262b] rounded-xl text-muted hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
