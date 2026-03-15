'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
}

export default function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = () => {
    try {
      const viewed = localStorage.getItem('recentlyViewed');
      if (viewed) {
        const parsed = JSON.parse(viewed);
        // Filter out duplicates and limit to 6
        const unique = Array.from(
          new Map(parsed.map((p: Product) => [p.id, p])).values()
        );
        setProducts(unique.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  };

  const getProductImage = (prod: Product | null): string => {
    if (!prod) return '/placeholder.jpg';
    if (prod.imageUrl) {
      if (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://')) {
        return prod.imageUrl;
      }
      if (prod.imageUrl.startsWith('/')) {
        return prod.imageUrl;
      }
      return `/${prod.imageUrl}`;
    }
    const images = Array.isArray(prod.images) ? prod.images : [];
    if (images.length > 0 && images[0]) {
      const firstImage = images[0];
      if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
        return firstImage;
      }
      if (firstImage.startsWith('/')) {
        return firstImage;
      }
      return `/${firstImage}`;
    }
    return '/placeholder.jpg';
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const imageUrl = getProductImage(product);

    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl: imageUrl !== '/placeholder.jpg' ? imageUrl : undefined,
      quantity: 1,
    });
    toast.success('Товар додано до кошика');
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-border pt-8">
      <h2 className="text-2xl font-light mb-8">Нещодавно переглянуті</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/catalog/${product.id}`}
            className="product-card group"
          >
            {/* Image Container */}
            <div className="aspect-square overflow-hidden bg-[#1f1f23] relative">
              <img
                src={getProductImage(product)}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/500?text=No+Image';
                }}
              />

              {/* Out of Stock Overlay */}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-sm font-medium text-[#9ca3af]">Немає в наявності</span>
                </div>
              )}

              {/* Quick Add Button */}
              {product.stock > 0 && (
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="absolute bottom-3 right-3 p-3 bg-[#6366f1] text-white rounded-full
                           opacity-0 group-hover:opacity-100 transition-all duration-300
                           hover:bg-[#818cf8] hover:shadow-lg hover:shadow-[#6366f1]/50
                           transform group-hover:translate-y-0 translate-y-2"
                  aria-label="Додати до кошика"
                >
                  <ShoppingCart size={18} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h3 className="font-medium text-xs md:text-sm mb-2 text-white line-clamp-2 min-h-[2.5rem]">
                {product.title}
              </h3>
              <span className="text-sm md:text-base font-light text-white">
                {Number(product.price).toLocaleString('uk-UA')} ₴
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
