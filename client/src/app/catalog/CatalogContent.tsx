'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, SlidersHorizontal, Star } from 'lucide-react';
import ProductModal from '@/components/ProductModal';

interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  reviewCount?: number;
}

interface SafeProduct extends Omit<Product, 'images'> {
  images: string[] | null;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Новизна' },
  { value: 'price', label: 'Ціна' },
  { value: 'title', label: 'Назва' },
  { value: 'popularity', label: 'Популярність' },
];

const ORDER_OPTIONS = [
  { value: 'desc', label: 'За спаданням' },
  { value: 'asc', label: 'За зростанням' },
];

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const addItem = useCartStore((state) => state.addItem);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategories([]);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Update URL params
  const updateURL = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/catalog?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Handle search param on mount
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Build params object only with meaningful values
      const params: Record<string, string | number | undefined> = {
        limit: 50,
        sortBy,
        sortOrder,
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (priceRange[0] > 0) {
        params.minPrice = priceRange[0];
      }
      if (priceRange[1] > 0 && priceRange[1] < 100000) {
        params.maxPrice = priceRange[1];
      }
      
      const response = await productsApi.getAll(params);
      let filteredProducts = response.data.products;

      // Additional client-side price filtering (backend already filters)
      filteredProducts = filteredProducts.filter(
        (p: SafeProduct) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );

      setProducts(filteredProducts);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, sortBy, sortOrder, selectedCategory, priceRange]);

  const handleProductClick = (product: SafeProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const getProductImage = (prod: SafeProduct | null): string => {
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

  const handleAddToCart = (e: React.MouseEvent, product: SafeProduct) => {
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

  const handleSortChange = (field: string, value: string) => {
    updateURL({ [field]: value });
    if (field === 'sortBy') setSortBy(value);
    if (field === 'sortOrder') setSortOrder(value as 'asc' | 'desc');
  };

  return (
    <>
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#18181c] to-[#1f1f23] border-b border-[#26262b]">
          <div className="container mx-auto px-4 py-12">
            <h1 className="section-title mb-4 bg-gradient-to-r from-white to-[#9ca3af] bg-clip-text text-transparent">Каталог</h1>
            <p className="text-[#9ca3af] text-lg">Обирай сучасну електроніку для себе та близьких</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search and Filters Toggle */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={20} />
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateURL({ search: e.target.value });
                }}
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
            <div className="card p-6 mb-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">Сортування</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange('sortBy', e.target.value)}
                    className="input-field"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">Порядок</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange('sortOrder', e.target.value)}
                    className="input-field"
                  >
                    {ORDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">Категорія</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Всі категорії</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                    Макс. ціна: {priceRange[1].toLocaleString('uk-UA')} ₴
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-[#6366f1]"
                  />
                </div>
              </div>
              {/* Reset Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setSortBy('createdAt');
                    setSortOrder('desc');
                    setSelectedCategory('');
                    setPriceRange([0, 100000]);
                    updateURL({});
                  }}
                  className="text-sm text-[#9ca3af] hover:text-primary transition-colors"
                >
                  Скинути фільтри
                </button>
              </div>
            </div>
          )}

          {/* Products Grid with Skeleton Loading */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-[#1f1f23] rounded mb-2" />
                  <div className="h-4 bg-[#1f1f23] rounded mb-2" />
                  <div className="h-6 bg-[#1f1f23] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-[#9ca3af] text-sm">
                  Знайдено товарів: <span className="text-white font-medium">{products.length}</span>
                </p>
              </div>

              {/* Modern Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="product-card group cursor-pointer"
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
                    <div className="p-4">
                      <h3 className="font-medium text-sm md:text-base mb-2 text-white line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* SKU */}
                      <p className="text-xs text-[#9ca3af] mb-2 font-mono">
                        SKU: {product.sku.slice(0, 8).toUpperCase()}
                      </p>

                      {/* Rating */}
                      {product.averageRating !== undefined && product.reviewCount !== undefined && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={14} className="fill-yellow-500 text-yellow-500" />
                          <span className="text-xs text-[#9ca3af]">
                            {product.averageRating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-light text-white">
                          {Number(product.price).toLocaleString('uk-UA')} ₴
                        </span>
                        {product.stock > 0 ? (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            В наявності
                          </span>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">Недоступно</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-[#9ca3af] text-lg mb-4">Товари не знайдено</div>
                  <button
                    onClick={() => {
                      setSearch('');
                      setSortBy('createdAt');
                      setSortOrder('desc');
                      setSelectedCategory('');
                      setPriceRange([0, 100000]);
                      updateURL({});
                    }}
                    className="btn-primary"
                  >
                    Скинути фільтри
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
