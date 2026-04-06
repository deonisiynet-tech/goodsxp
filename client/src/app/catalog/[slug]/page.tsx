'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi, Review } from '@/lib/products-api';
import { useCartStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/wishlist';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Check, ChevronLeft, ChevronRight, Star, Send, Trash2, Truck, Shield, RotateCcw, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  discountPrice: number | null;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  averageRating?: number;
  reviewCount?: number;
}

type ReviewSortOption = 'newest' | 'best' | 'worst';

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
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const addItem = useCartStore((state) => state.addItem);
  const setLastAddedPosition = useCartStore((state) => state.setLastAddedPosition);
  const wishlistToggle = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  useEffect(() => {
    if (params.slug) {
      loadProduct(params.slug as string);
    }
  }, [params.slug]);

  useEffect(() => {
    if (product) {
      loadReviews(product.slug);
      loadRelated(product.id);
    }
  }, [product, sortBy]);

  const loadRelated = async (productId: string) => {
    try {
      const response = await productsApi.getRelated(productId, 4);
      setRelatedProducts(response.products || []);
    } catch {
      setRelatedProducts([]);
    }
  };

  const loadProduct = async (slug: string) => {
    try {
      const response = await productsApi.getBySlug(slug);
      setProduct(response);
    } catch (error: any) {
      console.error('Failed to load product:', error);
      toast.error('Товар не знайдено');
      router.push('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (slug: string) => {
    try {
      const response = await productsApi.getReviewsBySlug(slug, sortBy);
      setReviews(response.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmittingReview(true);
    try {
      const newReview = await productsApi.createReviewBySlug(product.slug, {
        name: newName,
        rating: newRating,
        comment: newComment,
      });
      setReviews((prev) => [...prev, newReview]);
      setShowReviewForm(false);
      setNewName('');
      setNewComment('');
      setNewRating(5);
      toast.success('Відгук додано!');
      loadProduct(product.slug);
    } catch (error: any) {
      toast.error(error.message || 'Помилка при додаванні відгуку');
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

    // ✅ Анімація польоту до кошика
    const button = document.querySelector('[data-add-to-cart-btn]') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      setLastAddedPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    // Використовуємо discountPrice якщо є і вона менша за price
    const actualPrice = (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;

    const imageList = getImageList(product);
    const imageUrl = imageList.length > 0 ? imageList[0] : undefined;

    addItem({
      productId: product.id,
      title: product.title,
      price: Number(actualPrice),
      imageUrl,
    });

    toast.success('Товар додано до кошика');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const wasInWishlist = isInWishlist(product.id);
    const actualPrice = (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;
    const imageList = getImageList(product);
    const imageUrl = imageList.length > 0 ? imageList[0] : undefined;

    wishlistToggle({
      productId: product.id,
      title: product.title,
      price: Number(actualPrice),
      imageUrl: imageUrl || null,
    });
    toast.success(
      wasInWishlist ? '🗑️ Видалено з обраного' : '❤️ Додано до обраного'
    );
  };

  const getImageUrl = (img: string): string => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    if (img.startsWith('/')) {
      return img;
    }
    return `/${img}`;
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

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'fill-gray-600 text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

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
            <p className="text-[#9ca3af]">Товар не знайдено</p>
            <Link href="/catalog" className="text-[#6366f1] hover:underline mt-4 inline-block">
              До каталогу
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ✅ Тепер product гарантовано не null — обчислення БЕЗПЕЧНІ
  const images = getImageList(product);
  const safeSelectedIndex = images.length > 0
    ? Math.min(selectedImage, images.length - 1)
    : 0;

  const discountPercent = product.discountPrice && product.originalPrice
    ? Math.round((1 - product.discountPrice / product.originalPrice) * 100)
    : 0;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://goodsxp.store';
  const productPrice = product.discountPrice && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

  // JSON-LD Product structured data
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || '',
    image: images.length > 0 ? images : undefined,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: Number(productPrice).toFixed(2),
      priceCurrency: 'UAH',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/catalog/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'GoodsXP',
      },
    },
    ...(product.averageRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.reviewCount || 0,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* JSON-LD Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* ✅ Breadcrumbs with Schema.org */}
          <nav className="flex items-center gap-2 text-sm text-[#9ca3af] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-400 transition-colors">Головна</Link>
            <span className="text-[#26262b]">/</span>
            <Link href="/catalog" className="hover:text-purple-400 transition-colors">Каталог</Link>
            <span className="text-[#26262b]">/</span>
            <span className="text-white">{product.title}</span>
          </nav>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Головна', item: siteUrl },
                  { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${siteUrl}/catalog` },
                  { '@type': 'ListItem', position: 3, name: product.title, item: `${siteUrl}/catalog/${product.slug}` },
                ],
              }),
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Images Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#1f1f23] border border-[#26262b] relative group">
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
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#0f0f12]/80 backdrop-blur-sm text-white text-sm rounded-full">
                          {safeSelectedIndex + 1} / {images.length}
                        </div>
                        <button
                          onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                          disabled={safeSelectedIndex === 0}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full hover:bg-[#1f1f23] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() => setSelectedImage((prev) => Math.min(images.length - 1, prev + 1))}
                          disabled={safeSelectedIndex === images.length - 1}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full hover:bg-[#1f1f23] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                          ? 'border-[#6366f1] ring-2 ring-[#6366f1]/30 scale-105'
                          : 'border-[#26262b] hover:border-[#6366f1]/50'
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
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-light text-white">{product.title}</h1>
                {/* ✅ Share button */}
                <button
                  onClick={async () => {
                    const url = window.location.href;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: product.title, url });
                      } catch { /* User cancelled */ }
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Посилання скопійовано');
                    }
                  }}
                  className="p-2.5 rounded-xl border border-[#26262b] text-muted hover:text-white hover:border-purple-500/50 transition-all shrink-0"
                  title="Поділитися"
                >
                  <Share2 size={20} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.isFeatured && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg shadow-lg">
                    🔥 Хіт-продаж
                  </span>
                )}
                {product.isPopular && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg">
                    ⭐ Популярний
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg">
                    -{discountPercent}% Знижка
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                {product.reviewCount && product.reviewCount > 0 ? (
                  <>
                    {renderStars(Math.round(product.averageRating || 0), 18)}
                    <span className="text-[#9ca3af] text-sm">
                      {product.averageRating?.toFixed(1) || '0.0'} з 5
                    </span>
                    <button
                      onClick={scrollToReviews}
                      className="text-sm text-[#6366f1] hover:text-[#818cf8] transition-colors"
                    >
                      ({product.reviewCount} відгуків)
                    </button>
                  </>
                ) : (
                  <span className="text-[#9ca3af] text-sm">
                    ⭐ Немає відгуків
                  </span>
                )}
              </div>

              {/* Price with discount */}
              <div className="mb-6">
                {product.discountPrice && product.originalPrice ? (
                  <div className="flex items-baseline gap-4">
                    <span className="text-4xl font-bold text-white">
                      {Number(product.discountPrice).toLocaleString('uk-UA')} ₴
                    </span>
                    <span className="text-xl text-[#9ca3af] line-through">
                      {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                ) : (
                  <p className="text-4xl font-light text-white">
                    {Number(product.price).toLocaleString('uk-UA')} ₴
                  </p>
                )}
              </div>

              {/* Stock Status + Urgency */}
              <div className="mb-6 space-y-3">
                <div
                  className={`flex items-center gap-2 ${
                    product.stock > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {product.stock > 0 ? (
                    <>
                      <Check size={20} strokeWidth={2} />
                      <span className="text-sm font-medium">
                        В наявності
                        {product.stock <= 10 && (
                          <span className="ml-2 text-orange-400">
                            ⚡ Залишилось лише {product.stock} шт.
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={20} strokeWidth={2} />
                      <span className="text-sm font-medium">Немає в наявності</span>
                    </>
                  )}
                </div>

                {/* ✅ Urgency: "People viewing" */}
                {product.stock > 0 && product.stock <= 15 && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs font-medium">
                      Зараз переглядають: {Math.floor(Math.random() * 5) + 2} осіб
                    </span>
                  </div>
                )}

                {/* ✅ Urgency: Free shipping threshold */}
                <div className="flex items-center gap-2 text-green-400">
                  <Truck size={16} />
                  <span className="text-xs font-medium">
                    Безкоштовна доставка при замовленні від 5000 ₴
                  </span>
                </div>
              </div>

              {/* ✅ Tabs: Description / Specs / Reviews */}
              <div className="mb-8">
                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-[#26262b] mb-6">
                  {[
                    { key: 'description' as const, label: 'Опис' },
                    { key: 'specs' as const, label: 'Характеристики' },
                    { key: 'reviews' as const, label: `Відгуки (${product.reviewCount || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        if (tab.key === 'reviews') {
                          setTimeout(() => {
                            const reviewsSection = document.getElementById('reviews-section');
                            if (reviewsSection) {
                              reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }
                      }}
                      className={`px-4 py-3 text-sm font-medium transition-all relative ${
                        activeTab === tab.key
                          ? 'text-white'
                          : 'text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'description' && (
                  <div className="text-[#9ca3af] leading-relaxed">
                    {product.description ? (
                      <p>{product.description}</p>
                    ) : (
                      <p className="text-[#9ca3af]">Опис товару скоро з'явиться. Зверніться до менеджера для отримання деталей.</p>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-3">
                    {/* ✅ Generic specs table — will be populated from product.description or defaults */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Тип товару</span>
                        <span className="text-white text-sm font-medium">Електроніка</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Гарантія</span>
                        <span className="text-white text-sm font-medium">12 місяців</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Доставка</span>
                        <span className="text-white text-sm font-medium">Нова Пошта, 1–3 дні</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Повернення</span>
                        <span className="text-white text-sm font-medium">14 днів</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Оплата</span>
                        <span className="text-white text-sm font-medium">При отриманні / Онлайн</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">Стан</span>
                        <span className="text-green-400 text-sm font-medium">Новий</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    {/* Reviews will be rendered below this tab section */}
                    <div id="reviews-inline" />
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Truck size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Швидка доставка</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Shield size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Підтримка клієнтів</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <RotateCcw size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Повернення 14 днів</span>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4 mt-auto">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-[#9ca3af]">Кількість:</label>
                  <div className="flex items-center border border-[#26262b] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 bg-[#1f1f23] hover:bg-[#26262b] transition-colors"
                    >
                      −
                    </button>
                    <span className="w-16 text-center text-white font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-3 bg-[#1f1f23] hover:bg-[#26262b] transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  data-add-to-cart-btn
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  {product.stock > 0 ? 'Додати до кошика' : 'Товар недоступний'}
                </button>

                {/* ✅ Wishlist button */}
                <button
                  onClick={handleWishlistToggle}
                  className={`w-full py-3 text-base flex items-center justify-center gap-2 rounded-xl border transition-all ${
                    isInWishlist(product.id)
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-purple-500/20 text-[#9ca3af] hover:border-purple-500/50 hover:text-white'
                  }`}
                >
                  <Heart size={20} className={isInWishlist(product.id) ? 'fill-red-500' : ''} />
                  {isInWishlist(product.id) ? 'В обраному' : 'До обраного'}
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-[#26262b] mt-8 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Гарантія:</span>
                  <span className="text-white">12 місяців</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div id="reviews-section" className="mt-16 border-t border-[#26262b] pt-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <h2 className="text-3xl font-light text-white">Відгуки</h2>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-[#9ca3af]">Сортування:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
                  className="input-field py-2 px-3 text-sm"
                >
                  <option value="newest">Найновіші</option>
                  <option value="best">Найкращі</option>
                  <option value="worst">Найгірші</option>
                </select>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-[#18181c] rounded-2xl border border-[#26262b]">
                <p className="text-[#9ca3af] mb-6">
                  Відгуків поки немає. Будьте першим, хто залишить відгук.
                </p>
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
                <div className="space-y-4 mb-8">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-6 bg-[#18181c] border border-[#26262b]">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-2">{review.name}</h4>
                          {renderStars(review.rating, 14)}
                        </div>
                        <span className="text-xs text-[#9ca3af]">
                          {new Date(review.createdAt).toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-[#9ca3af] text-sm leading-relaxed">{review.comment}</p>
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
        </div>

        {/* ✅ Cross-sell: Вас може зацікавити */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-[#26262b] pt-12">
            <h2 className="text-2xl font-light mb-8">Вас може зацікавити</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/catalog/${rp.slug}`}
                  className="group card cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden bg-[#1f1f23] rounded-xl">
                    <img
                      src={rp.imageUrl || '/placeholder.jpg'}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
                      {rp.title}
                    </h3>
                    {rp.discountPrice && rp.originalPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-white">
                          {Number(rp.discountPrice).toLocaleString('uk-UA')} ₴
                        </span>
                        <span className="text-xs text-[#9ca3af] line-through">
                          {Number(rp.originalPrice).toLocaleString('uk-UA')} ₴
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-light text-white">
                        {Number(rp.price).toLocaleString('uk-UA')} ₴
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-sm" 
            onClick={() => setShowReviewForm(false)}
          />
          <div className="relative bg-[#18181c] border border-[#6366f1]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-[#6366f1]/20 animate-fade-in">
            <h3 className="text-2xl font-light text-white mb-6">Залишити відгук</h3>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Рейтинг</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= newRating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'fill-gray-600 text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Ім'я</label>
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
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Коментар</label>
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
      <Footer />
    </div>
  );
}
