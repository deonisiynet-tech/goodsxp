'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
}

interface SimilarProductsProps {
  productId: string;
  currentProductTitle?: string;
}

export default function SimilarProducts({ productId, currentProductTitle }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadSimilarProducts();
  }, [productId]);

  const loadSimilarProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getSimilar(productId, 4);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to load similar products:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="mt-16 border-t border-border pt-8">
        <h2 className="text-2xl font-light mb-8">Схожі товари</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-[#1f1f23] rounded-lg mb-2" />
              <div className="h-4 bg-[#1f1f23] rounded mb-2" />
              <div className="h-6 bg-[#1f1f23] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-border pt-8">
      <h2 className="text-2xl font-light mb-8">Схожі товари</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
          </a>
        ))}
      </div>
    </div>
  );
}
