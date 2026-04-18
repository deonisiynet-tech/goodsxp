'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/products-api';
import { useCartStore } from '@/lib/store';
import { generateItemListJsonLd } from '@/lib/schema';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, SlidersHorizontal, Star, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPrice: number | null;
  isFeatured: boolean;
  isPopular: boolean;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  reviewCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { products: number };
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Новизна' },
  { value: 'price', label: 'Ціна (дешевше)' },
  { value: 'title', label: 'Назва' },
];

const ITEMS_PER_PAGE = 12;

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  );
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const gridRef = useRef<HTMLDivElement>(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productsApi.getCategories();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Debounce search (500ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Fetch autocomplete suggestions with debounce
  useEffect(() => {
    if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);

    if (search.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await productsApi.searchSuggestions(search.trim());
        setSuggestions(res.suggestions || []);
        setShowSuggestions((res.suggestions || []).length > 0);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
    };
  }, [search]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
    if (searchParam) setSearch(searchParam);
    const pageParam = searchParams.get('page');
    if (pageParam) setCurrentPage(parseInt(pageParam));
  }, [searchParams]);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      };
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (featuredOnly) {
        params.featured = 'true';
      } else if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (priceMax < 100000) {
        params.maxPrice = priceMax;
      }

      const response = await productsApi.getAll(params);
      setProducts(response.products || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalProducts(response.pagination?.total || 0);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, sortBy, sortOrder, selectedCategory, featuredOnly, priceMax]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Scroll to top on page change
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const handleProductClick = (product: Product) => {
    router.push(`/catalog/${product.slug}`);
  };

  const getProductImage = (prod: Product | null): string => {
    if (!prod) return '/placeholder.jpg';
    if (prod.imageUrl) {
      if (prod.imageUrl.startsWith('http')) return prod.imageUrl;
      if (prod.imageUrl.startsWith('/')) return prod.imageUrl;
      return `/${prod.imageUrl}`;
    }
    const images = Array.isArray(prod.images) ? prod.images : [];
    if (images.length > 0 && images[0]) {
      const firstImage = images[0];
      if (firstImage.startsWith('http')) return firstImage;
      if (firstImage.startsWith('/')) return firstImage;
      return `/${firstImage}`;
    }
    return '/placeholder.jpg';
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const actualPrice = (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;
    const imageUrl = getProductImage(product);
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(actualPrice),
      imageUrl: imageUrl !== '/placeholder.jpg' ? imageUrl : undefined,
    });
    toast.success('Товар додано до кошика');
  };

  const handleSelectSuggestion = (slug: string, title: string) => {
    setSearch(title);
    setDebouncedSearch(title);
    setShowSuggestions(false);
    router.push(`/catalog/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        updateURL({ search: debouncedSearch, page: '' });
        setCurrentPage(1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightedIndex];
      handleSelectSuggestion(selected.slug, selected.title);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      updateURL({ search: debouncedSearch, page: '' });
      setCurrentPage(1);
      setShowSuggestions(false);
    }
  };

  const handleSortChange = (field: string, value: string) => {
    setCurrentPage(1);
    updateURL({ [field]: value, page: '' });
    if (field === 'sortBy') setSortBy(value);
    if (field === 'sortOrder') setSortOrder(value as 'asc' | 'desc');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page: String(page) });
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSelectedCategory('');
    setPriceMax(100000);
    setCurrentPage(1);
    updateURL({});
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

        <div className="container mx-auto px-4 py-8" ref={gridRef}>
          {/* Quick Category Chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setFeaturedOnly(false); setSelectedCategory(''); setCurrentPage(1); updateURL({ category: '', page: '', featured: '' }); }}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all ${
                  !selectedCategory && !featuredOnly
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-[#1f1f23] text-[#9ca3af] border border-[#26262b] hover:border-purple-500/50'
                }`}
              >
                Всі
              </button>
              <button
                onClick={() => { setFeaturedOnly(true); setSelectedCategory(''); setCurrentPage(1); updateURL({ category: '', page: '', featured: 'true' }); }}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all ${
                  featuredOnly
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-[#1f1f23] text-[#9ca3af] border border-[#26262b] hover:border-purple-500/50'
                }`}
              >
                🔥 Хіт-продаж
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setFeaturedOnly(false); setSelectedCategory(cat.slug); setCurrentPage(1); updateURL({ category: cat.slug, page: '', featured: '' }); }}
                  className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-[#1f1f23] text-[#9ca3af] border border-[#26262b] hover:border-purple-500/50'
                  }`}
                >
                  {cat.name}
                  {cat._count?.products !== undefined && (
                    <span className="ml-1 text-xs opacity-70">({cat._count.products})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search and Filters Toggle */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1" ref={suggestionsRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={20} />
              <input
                type="text"
                placeholder="Пошук товарів..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onKeyDown={handleKeyDown}
                className="input-field pl-12"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-haspopup="listbox"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setCurrentPage(1);
                    updateURL({ search: '', page: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute z-50 mt-2 w-full bg-[#18181c] border border-[#26262b] rounded-xl shadow-2xl shadow-purple-500/10 overflow-hidden"
                  role="listbox"
                >
                  {suggestions.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectSuggestion(product.slug, product.title)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        index === highlightedIndex
                          ? 'bg-purple-500/10 border-l-2 border-purple-500'
                          : 'hover:bg-[#1f1f23] border-l-2 border-transparent'
                      }`}
                      role="option"
                      aria-selected={index === highlightedIndex}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1f1f23] shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl.startsWith('http') ? product.imageUrl : product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6b7280]">
                            <Search size={14} />
                          </div>
                        )}
                      </div>
                      {/* Title + Discount badge */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate block">{product.title}</span>
                        {product.discountPrice && product.originalPrice && (
                          <span className="text-[10px] font-semibold text-green-400">
                            -{Math.round((1 - product.discountPrice / product.originalPrice) * 100)}% знижка
                          </span>
                        )}
                      </div>
                      {/* Price */}
                      <div className="text-right shrink-0">
                        {product.discountPrice && product.originalPrice ? (
                          <>
                            <span className="text-xs text-[#6b7280] line-through block">
                              {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
                            </span>
                            <span className="text-sm font-bold text-green-400 block">
                              {Number(product.discountPrice).toLocaleString('uk-UA')} ₴
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-purple-400">
                            {Number(product.price).toLocaleString('uk-UA')} ₴
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-dark flex items-center justify-center gap-2 ${showFilters ? 'border-purple-500/50' : ''}`}
            >
              <Filter size={20} />
              Фільтри
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card p-6 mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-purple-400" />
                  Фільтри
                </h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-muted hover:text-purple-400 transition-colors min-h-[44px] px-3"
                >
                  Скинути все
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-white">Сортування</label>
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
                  <label className="block text-sm font-medium mb-3 text-white">Порядок</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange('sortOrder', e.target.value)}
                    className="input-field"
                  >
                    <option value="desc">За спаданням</option>
                    <option value="asc">За зростанням</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-3 text-white">
                    Ціна: до {priceMax.toLocaleString('uk-UA')} ₴
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="1000"
                      value={priceMax}
                      onChange={(e) => setPriceMax(parseInt(e.target.value))}
                      onMouseUp={() => setCurrentPage(1)}
                      onTouchEnd={() => setCurrentPage(1)}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-sm text-purple-400 font-medium min-w-[100px] text-right">
                      {priceMax === 100000 ? 'Без ліміту' : `${priceMax.toLocaleString('uk-UA')} ₴`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted mt-2">
                    <span>0 ₴</span>
                    <span>100 000 ₴</span>
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedCategory || featuredOnly || priceMax < 100000 || debouncedSearch) && (
                <div className="mt-6 pt-6 border-t border-purple-500/10">
                  <p className="text-sm text-muted mb-3">Активні фільтри:</p>
                  <div className="flex flex-wrap gap-2">
                    {debouncedSearch && (
                      <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                        Пошук: "{debouncedSearch}"
                      </span>
                    )}
                    {featuredOnly && (
                      <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs rounded-full border border-orange-500/20">
                        🔥 Хіт-продаж
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                        {categories.find(c => c.slug === selectedCategory)?.name || 'Категорія'}
                      </span>
                    )}
                    {priceMax < 100000 && (
                      <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                        До {priceMax.toLocaleString('uk-UA')} ₴
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products count */}
          {!loading && (
            <div className="flex justify-between items-center mb-6">
              <p className="text-[#9ca3af] text-sm">
                Знайдено товарів: <span className="text-white font-medium">{totalProducts}</span>
              </p>
            </div>
          )}

          {/* Products Grid with Skeleton Loading */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-[#1f1f23] rounded-xl mb-3" />
                  <div className="h-4 bg-[#1f1f23] rounded mb-2" />
                  <div className="h-6 bg-[#1f1f23] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-[#9ca3af] text-lg mb-4">Товари не знайдено</div>
              <button onClick={resetFilters} className="btn-primary">
                Скинути фільтри
              </button>
            </div>
          ) : (
            <>
              {/* JSON-LD: ItemList for SEO */}
              {products.length > 0 && (
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateItemListJsonLd(products, currentPage)),
                  }}
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="product-card group cursor-pointer"
                  >
                    {/* Image Container */}
                    <div className="aspect-square overflow-hidden bg-[#1f1f23] relative rounded-xl">
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=No+Image';
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isFeatured && (
                          <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded shadow-lg">
                            🔥 Хіт
                          </span>
                        )}
                        {product.discountPrice && product.originalPrice && (
                          <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded shadow-lg">
                            -{Math.round((1 - product.discountPrice / product.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Out of Stock Overlay */}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-sm font-medium text-[#9ca3af]">Немає в наявності</span>
                        </div>
                      )}

                      {/* Quick Add Button — visible on mobile always, on desktop on hover */}
                      {product.stock > 0 && (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="absolute bottom-3 right-3 p-3 bg-[#6366f1] text-white rounded-full
                                   opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300
                                   hover:bg-[#818cf8] hover:shadow-lg hover:shadow-[#6366f1]/50
                                   transform md:translate-y-2 md:group-hover:translate-y-0"
                          aria-label="Додати до кошика"
                        >
                          <ShoppingCart size={18} strokeWidth={2} />
                        </button>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3 md:p-4">
                      <h3 className="font-medium text-sm md:text-base mb-2 text-white line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Rating */}
                      {product.averageRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={14} className="fill-yellow-500 text-yellow-500" />
                          <span className="text-xs text-[#9ca3af]">
                            {product.averageRating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}

                      {/* Price with discount */}
                      {product.discountPrice && product.originalPrice ? (
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-base md:text-lg font-bold text-white">
                            {Number(product.discountPrice).toLocaleString('uk-UA')} ₴
                          </span>
                          <span className="text-xs md:text-sm text-[#9ca3af] line-through">
                            {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
                          </span>
                        </div>
                      ) : (
                        <span className="text-base md:text-lg font-light text-white mb-2 block">
                          {Number(product.price).toLocaleString('uk-UA')} ₴
                        </span>
                      )}

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
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#1f1f23] border border-[#26262b] text-[#9ca3af] hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-11 h-11 rounded-lg text-sm font-medium transition-all ${
                        currentPage === i + 1
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-[#1f1f23] border border-[#26262b] text-[#9ca3af] hover:border-purple-500/50 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#1f1f23] border border-[#26262b] text-[#9ca3af] hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
