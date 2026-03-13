'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductModal from '@/components/ProductModal';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SafeProduct extends Omit<Product, 'images'> {
  images: string[] | null;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SafeProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        (p: SafeProduct) => p.price >= priceRange[0] && p.price <= priceRange[1]
      );

      // Sort
      filteredProducts.sort((a: SafeProduct, b: SafeProduct) => {
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

  const handleProductClick = (product: SafeProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Helper to normalize image path - ALWAYS returns path starting with /uploads/
  const normalizeImagePath = (img: string | null | undefined): string => {
    if (!img) return '/placeholder.jpg';
    if (img.startsWith('/uploads/')) return img;
    if (img.startsWith('/')) return `/uploads${img}`;
    return `/uploads/${img}`;
  };

  // Safe image getter for single image display
  const getProductImage = (prod: SafeProduct | null): string => {
    if (!prod) return '/placeholder.jpg';
    
    // Try imageUrl first
    if (prod.imageUrl) {
      return normalizeImagePath(prod.imageUrl);
    }
    
    // Try images array
    const images = Array.isArray(prod.images) ? prod.images : [];
    if (images.length > 0 && images[0]) {
      return normalizeImagePath(images[0]);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f12]">
      <Header />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#18181c] to-[#1f1f23] border-b border-[#26262b]">
          <div className="container mx-auto px-4 py-12">
            <h1 className="section-title mb-4 bg-gradient-to-r from-white to-[#9ca3af] bg-clip-text text-transparent">Каталог</h1>
            <p className="text-[#9ca3af] text-lg">Обирай сучасну електроніку для себе та близьких</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={20} />
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
            <div className="card p-6 mb-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">Сортування</label>
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
                  <label className="block text-sm font-medium mb-2 text-[#9ca3af]">Порядок</label>
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
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-[#9ca3af] text-sm">
                  Знайдено товарів: <span className="text-white font-medium">{products.length}</span>
                </p>
              </div>
              
              {/* Modern Product Grid - 2 columns mobile, 3 tablet, 4 desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
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
                      
                      {/* Quick Add Button - appears on hover */}
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
                      setSearch('')
                      setPriceRange([0, 100000])
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
      <Footer />
      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
