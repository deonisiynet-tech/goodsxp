'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Check, ChevronLeft, ChevronRight, Star, Send } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
      loadReviews(params.id as string);
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

  const loadReviews = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          rating: newRating,
          comment: newComment,
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews((prev) => [...prev, newReview]);
        setShowReviewForm(false);
        setNewName('');
        setNewComment('');
        setNewRating(5);
        toast.success('Відгук додано!');
        loadProduct(product.id);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Помилка при додаванні відгуку');
      }
    } catch (error) {
      toast.error('Помилка при додаванні відгуку');
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const imageList = getImageList(product);
    const imageUrl = imageList.length > 0 ? imageList[0] : undefined;

    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl,
      quantity: 1,
    });

    toast.success('Товар додано до кошика');
  };

  const getImageUrl = (img: string): string => {
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img
    }
    if (img.startsWith('/')) {
      return img
    }
    return `/${img}`
  };

  const getImageList = (prod: Product | null): string[] => {
    if (!prod) return [];
    const images = Array.isArray(prod.images) ? prod.images : [];
    const imageUrls = images.map(getImageUrl).filter(Boolean);
    if (imageUrls.length === 0 && prod.imageUrl) {
      const imageUrl = getImageUrl(prod.imageUrl);
      if (imageUrl) return [imageUrl];
    }
    return imageUrls;
  };

  const images = getImageList(product);
  const safeSelectedIndex = images.length > 0
    ? Math.min(selectedImage, images.length - 1)
    : 0;

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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-muted">Товар не знайдено</p>
            <Link href="/catalog" className="text-primary hover:underline mt-4 inline-block">
              До каталогу
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
                    key={safeSelectedIndex}
                    src={images[safeSelectedIndex]}
                    alt={`${product.title} - view ${safeSelectedIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full">
                        {safeSelectedIndex + 1} / {images.length}
                      </div>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                        disabled={safeSelectedIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => Math.min(images.length - 1, prev + 1))}
                        disabled={safeSelectedIndex === images.length - 1}
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
                      safeSelectedIndex === idx
                        ? 'border-primary ring-2 ring-primary/30 scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-light mb-4">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={`${
                      product.averageRating && star <= Math.round(product.averageRating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={scrollToReviews}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {product.reviewCount || 0} відгуків
              </button>
            </div>

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
                <span className="text-muted">Гарантія:</span>
                <span>12 місяців</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="mt-16 border-t border-border pt-12">
          <h2 className="text-3xl font-light mb-8">Відгуки</h2>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted mb-6">Відгуків поки немає. Будьте першим, хто залишить відгук.</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send size={18} />
                Залишити відгук
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-6 mb-8">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-white mb-1">{review.name}</h4>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={`${
                                star <= review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(review.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-muted text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send size={18} />
                Залишити відгук
              </button>
            </>
          )}
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowReviewForm(false)} />
            <div className="relative bg-[#18181c] border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20">
              <h3 className="text-2xl font-light mb-6">Залишити відгук</h3>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Рейтинг</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={`${
                            star <= newRating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ім'я</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Ваше ім'я"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Коментар</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Ваш відгук..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={18} />
                    {submittingReview ? 'Відправка...' : 'Надіслати відгук'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
