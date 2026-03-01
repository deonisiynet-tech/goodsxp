'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react';
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

  const images = product?.images?.length ? product.images : [product.imageUrl];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-none overflow-hidden bg-surfaceLight">
              <img
                src={images[selectedImage] || product.imageUrl || '/placeholder.jpg'}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/800?text=No+Image';
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
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
