'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Star } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discountPrice?: number | null;
  imageUrl: string | null;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
}

interface ProductListProps {
  title?: string;
  limit?: number;
  showAllLink?: boolean;
}

export default function ProductList({ title = 'Каталог товарів', limit = 20, showAllLink = false }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ limit });
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      quantity: 1,
    });

    toast.success('Товар додано до кошика');
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {title && (
            <div className="flex justify-between items-center mb-10">
              <h2 className="section-title">{title}</h2>
              {showAllLink && (
                <div className="h-4 w-24 bg-[#1f1f23] rounded animate-pulse" />
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: limit > 8 ? 8 : limit }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-[#1f1f23] rounded-xl mb-4" />
                <div className="h-4 bg-[#1f1f23] rounded mb-2" />
                <div className="h-4 bg-[#1f1f23] rounded w-2/3 mb-4" />
                <div className="flex justify-between">
                  <div className="h-6 bg-[#1f1f23] rounded w-1/3" />
                  <div className="h-8 bg-[#1f1f23] rounded w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {title && (
          <div className="flex justify-between items-center mb-10">
            <h2 className="section-title">{title}</h2>
            {showAllLink && (
              <Link href="/catalog" className="text-sm font-light hover:text-secondary transition-colors">
                Дивитися всі →
              </Link>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted">
            Товари не знайдено
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/catalog/${product.id}`}
                className="group card animate-fade-in"
              >
                <div className="aspect-square overflow-hidden bg-surfaceLight relative">
                  <img
                    src={product.imageUrl || '/placeholder.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/500?text=No+Image';
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isFeatured && (
                      <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-md shadow-lg">
                        🔥 Хіт
                      </span>
                    )}
                    {product.isPopular && (
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-md shadow-lg">
                        ⭐ Популярний
                      </span>
                    )}
                    {product.discountPrice && product.originalPrice && (
                      <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-md shadow-lg">
                        -{Math.round((1 - product.discountPrice / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="text-sm font-medium">Немає в наявності</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-base mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                    {product.title}
                  </h3>

                  {/* Rating */}
                  {product.averageRating !== undefined && product.reviewCount !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={`${
                              star <= Math.round(product.averageRating!)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted">
                        {product.reviewCount} відгуків
                      </span>
                    </div>
                  )}

                  {/* Price with discount */}
                  <div className="mb-3">
                    {product.discountPrice && product.originalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {Number(product.discountPrice).toLocaleString('uk-UA')} ₴
                        </span>
                        <span className="text-sm text-muted line-through">
                          {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-light">
                        {Number(product.price).toLocaleString('uk-UA')} ₴
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {product.stock > 0 ? (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="p-2 hover:bg-surfaceLight transition-colors"
                        aria-label="Додати до кошика"
                      >
                        <ShoppingCart size={18} strokeWidth={1.5} />
                      </button>
                    ) : (
                      <span className="text-xs text-muted">Недоступно</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
