'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadProducts();
  }, [search, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ search, limit: 50 });
      let filteredProducts = response.data.products;

      // Filter by price
      filteredProducts = filteredProducts.filter(
        (p: Product) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );

      // Sort
      filteredProducts.sort((a: Product, b: Product) => {
        let comparison = 0;
        if (sortBy === 'price') {
          comparison = a.price - b.price;
        } else if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title, 'uk');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setProducts(filteredProducts);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="bg-surface border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <h1 className="section-title mb-4">Каталог</h1>
            <p className="text-muted">Обирай сучасну електроніку для себе та близьких</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-dark flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={20} />
              Фільтри
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card p-6 mb-8 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Сортування</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field"
                  >
                    <option value="createdAt">Новизна</option>
                    <option value="price">Ціна</option>
                    <option value="title">Назва</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Порядок</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="input-field"
                  >
                    <option value="desc">За спаданням</option>
                    <option value="asc">За зростанням</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Макс. ціна: {priceRange[1].toLocaleString('uk-UA')} ₴
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted text-sm">
                  Знайдено товарів: {products.length}
                </p>
              </div>
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
                      <p className="text-muted text-sm line-clamp-2 mb-3">{product.description}</p>
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
              {products.length === 0 && (
                <div className="text-center py-20 text-muted">
                  Товари не знайдено
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
