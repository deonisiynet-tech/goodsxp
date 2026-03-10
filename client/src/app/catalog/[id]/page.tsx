'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadProduct = async (id: string) => {
    try {
      const response = await productsApi.getById(id);
      setProduct(response.data);
    } catch (error: any) {
      toast.error('Товар не знайдено');
      router.push('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      quantity: 1,
    });

    toast.success('Товар додано до кошика');
  };

  const images = product?.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          До каталогу
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-surfaceLight border border-border relative group">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImage] || '/placeholder.jpg'}
                    alt={`${product.title} - view ${selectedImage + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full">
                        {selectedImage + 1} / {images.length}
                      </div>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                        disabled={selectedImage === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.min(images.length - 1, prev + 1))}
                        disabled={selectedImage === images.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <img
                  src="https://via.placeholder.com/800?text=No+Image"
                  alt="No image"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === idx 
                        ? 'border-primary ring-2 ring-primary/30 scale-105' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-light mb-4">{product.title}</h1>
            <p className="text-4xl font-light mb-6">
              {Number(product.price).toLocaleString('uk-UA')} ₴
            </p>

            <div
              className={`mb-6 ${
                product.stock > 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <Check size={20} />
                  <span>В наявності: {product.stock} шт.</span>
                </div>
              ) : (
                'Немає в наявності'
              )}
            </div>

            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-muted leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 mt-auto">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Кількість:</label>
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-surfaceLight transition-colors"
                  >
                    −
                  </button>
                  <span className="w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-3 hover:bg-surfaceLight transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? 'Додати до кошика' : 'Товар недоступний'}
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-border mt-8 pt-8 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Артикул:</span>
                <span>{product.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Категорія:</span>
                <span>Електроніка</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Гарантія:</span>
                <span>12 місяців</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
