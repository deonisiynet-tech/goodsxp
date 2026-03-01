'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
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
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-light">
                      {Number(product.price).toLocaleString('uk-UA')} ₴
                    </span>
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
