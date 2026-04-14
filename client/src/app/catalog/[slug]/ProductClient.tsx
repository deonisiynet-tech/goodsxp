'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, Review, ReviewImage } from '@/lib/products-api';
import { useCartStore } from '@/lib/store';
import { useWishlistStore } from '@/lib/wishlist';
import { normalizeImageUrl } from '@/lib/image-utils';
import VariantSelector, { ProductOption, ProductVariant, VariantOption } from '@/components/VariantSelector';
import DescriptionRenderer from '@/components/DescriptionRenderer';
import BuyPopup from '@/components/BuyPopup';
import ReviewSkeleton from '@/components/ReviewSkeleton';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Check, ChevronLeft, ChevronRight, Star, Send,
  Truck, Shield, RotateCcw, Heart, Share2, Trash2,
  Upload, X, ImageIcon, ZoomIn, Loader2,
} from 'lucide-react';

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
  options?: ProductOption[];
  variants?: ProductVariant[];
}

type ReviewSortOption = 'newest' | 'best' | 'worst';

export default function ProductClient({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newPros, setNewPros] = useState('');
  const [newCons, setNewCons] = useState('');
  const [newReviewImages, setNewReviewImages] = useState<File[]>([]);
  const [newReviewImagePreviews, setNewReviewImagePreviews] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const REVIEWS_PER_PAGE = 5;
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewPreviewUrlsRef = useRef<string[]>([]);

  const addItem = useCartStore((state) => state.addItem);
  const setLastAddedPosition = useCartStore((state) => state.setLastAddedPosition);
  const wishlistToggle = useWishlistStore((state) => state.toggleItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  // Variant state — variants тепер приходять з SSR (page.tsx)
  const hasVariants = (product.options?.length ?? 0) > 0;
  const finalOptions = product.options || [];
  const finalVariants = product.variants || [];

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showBuyPopup, setShowBuyPopup] = useState(false);

  // Find selected variant
  const selectedVariant = (() => {
    if (!hasVariants || finalVariants.length === 0) return null;
    const selectedValueIds = Object.values(selectedOptions);
    if (selectedValueIds.length === 0) return null;
    for (const v of finalVariants) {
      const vOpts = (v.options as VariantOption[]).map((o) => o.optionValueId).sort().join(',');
      const sOpts = [...selectedValueIds].sort().join(',');
      if (vOpts === sOpts) return v;
    }
    return null;
  })();

  const handleOptionSelect = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: prev[optionId] === valueId ? '' : valueId,
    }));
    // Reset image to main when options change
    setSelectedImage(0);
  };

  // Effective price & stock
  const effectivePrice = selectedVariant
    ? Number(selectedVariant.price)
    : (product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price);

  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;

  useEffect(() => {
    loadReviews(product.slug);
    loadRelated(product.id);

    // Check if current user is admin
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setIsAdmin(user?.role === 'ADMIN');
        } catch { /* ignore */ }
      }
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

  const loadReviews = async (slug: string, page = 1, append = false) => {
    if (!append) {
      setReviewsLoading(true);
      setReviewsPage(1);
    }

    try {
      const response = await productsApi.getReviewsBySlug(slug, sortBy, page, REVIEWS_PER_PAGE);
      setReviewsTotal(response.total || 0);

      if (append) {
        setReviews((prev) => [...prev, ...(response.reviews || [])]);
        setReviewsPage(page);
      } else {
        setReviews(response.reviews || []);
      }

      setHasMoreReviews((response.reviews?.length || 0) > 0 && (page * REVIEWS_PER_PAGE) < (response.total || 0));
    } catch {
      // Reviews are non-critical — just show empty state
      if (!append) setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadMoreReviews = () => {
    const nextPage = reviewsPage + 1;
    loadReviews(product.slug, nextPage, true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const newReview = await productsApi.createReview({
        productId: product.id,
        name: newName,
        rating: newRating,
        comment: newComment,
        pros: newPros || undefined,
        cons: newCons || undefined,
        images: newReviewImages.length > 0 ? newReviewImages : undefined,
      });
      // Reset first page and reload reviews to include the new one
      setReviews((prev) => [newReview, ...prev]);
      setReviewsTotal((prev) => prev + 1);
      setShowReviewForm(false);
      setNewName('');
      setNewComment('');
      setNewPros('');
      setNewCons('');
      setNewRating(5);
      resetReviewImages();
      toast.success('Відгук додано!');
    } catch (error: any) {
      toast.error(error.message || 'Помилка при додаванні відгуку');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Видалити цей відгук?')) return;
    try {
      await productsApi.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('Відгук видалено');
    } catch (error: any) {
      toast.error(error.message || 'Помилка видалення відгуку');
    }
  };

  // Review image handlers
  const MAX_REVIEW_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const resetReviewImages = () => {
    reviewPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    reviewPreviewUrlsRef.current = [];
    setNewReviewImages([]);
    setNewReviewImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = newReviewImages.length;
    const remainingSlots = MAX_REVIEW_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      toast.error(`Максимум ${MAX_REVIEW_IMAGES} фото`);
      return;
    }

    if (files.length > remainingSlots) {
      toast.error(`Можна додати ще тільки ${remainingSlots} фото`);
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files.slice(0, remainingSlots)) {
      // Check type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name} — непідтримуваний формат. Дозволено: JPG, PNG, WebP`);
        continue;
      }

      // Check size
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name} — завеликий файл (макс. 5MB)`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setNewReviewImages((prev) => [...prev, ...validFiles]);
      setNewReviewImagePreviews((prev) => {
        const nextPreviews = [...prev, ...validPreviews];
        reviewPreviewUrlsRef.current = nextPreviews;
        return nextPreviews;
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReviewImage = (index: number) => {
    setNewReviewImages((prev) => prev.filter((_, i) => i !== index));
    setNewReviewImagePreviews((prev) => {
      const nextPreviews = [...prev];
      const [removedPreview] = nextPreviews.splice(index, 1);
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }
      reviewPreviewUrlsRef.current = nextPreviews;
      return nextPreviews;
    });
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      reviewPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const openImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImageUrl(null);
  };

  const scrollToReviews = () => {
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = () => {
    const button = document.querySelector('[data-add-to-cart-btn]') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      setLastAddedPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    // Check variant selection
    if (hasVariants && !selectedVariant) {
      toast.error('Оберіть варіант товару');
      return;
    }

    const imageList = effectiveImage;
    const imageUrl = imageList.length > 0 ? imageList[0] : null;

    const variantOptions = selectedVariant
      ? (selectedVariant.options as VariantOption[]).map((o) => ({ name: o.name, value: o.value }))
      : undefined;

    addItem({
      productId: product.id,
      title: product.title,
      price: Number(effectivePrice),
      imageUrl,
      variantId: selectedVariant?.id,
      variantOptions,
      variantImage: selectedVariant?.image || null,
    });

    setShowBuyPopup(true);
  };

  const handleWishlistToggle = () => {
    const wasInWishlist = isInWishlist(product.id);
    const actualPrice = (product.discountPrice && product.discountPrice < product.price)
      ? product.discountPrice
      : product.price;
    const imageList = getImageList(product);
    const imageUrl = imageList.length > 0 ? imageList[0] : null;

    wishlistToggle({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: Number(actualPrice),
      imageUrl: imageUrl || null,
    });
    toast.success(
      wasInWishlist ? '🗑️ Видалено з обраного' : '❤️ Додано до обраного'
    );
  };

  const getImageList = (prod: Product | null): string[] => {
    if (!prod) return [];
    const images = Array.isArray(prod.images) ? prod.images : [];
    const imageUrls = images.map(normalizeImageUrl).filter(Boolean);
    if (imageUrls.length === 0 && prod.imageUrl) {
      const imageUrl = normalizeImageUrl(prod.imageUrl);
      if (imageUrl) return [imageUrl];
    }
    return imageUrls;
  };

  // Effective image — variant image or product images
  const effectiveImage = selectedVariant?.image
    ? [normalizeImageUrl(selectedVariant.image)]
    : getImageList(product);

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

  const images = effectiveImage;
  const safeSelectedIndex = images.length > 0
    ? Math.min(selectedImage, images.length - 1)
    : 0;

  const discountPercent = product.discountPrice && product.originalPrice
    ? Math.round((1 - product.discountPrice / product.originalPrice) * 100)
    : 0;

  // ✅ JSON-LD тепер генерується на сервері (page.tsx) — цей компонент тільки UI

  return (
    <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-sm text-[#9ca3af] mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-400 transition-colors">Головна</Link>
            <span className="text-[#26262b]">/</span>
            <Link href="/catalog" className="hover:text-purple-400 transition-colors">Каталог</Link>
            <span className="text-[#26262b]">/</span>
            <span className="text-white">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Images Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#1f1f23] border border-[#26262b] relative group">
                {images.length > 0 ? (
                  <>
                    <Image
                      key={safeSelectedIndex}
                      src={images[safeSelectedIndex]}
                      alt={`${product.title} - view ${safeSelectedIndex + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image';
                      }}
                    />
                    {images.length > 1 && (
                      <>
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#0f0f12]/80 backdrop-blur-sm text-white text-sm rounded-full z-10">
                          {safeSelectedIndex + 1} / {images.length}
                        </div>
                        <button
                          onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                          disabled={safeSelectedIndex === 0}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full hover:bg-[#1f1f23] transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() => setSelectedImage((prev) => Math.min(images.length - 1, prev + 1))}
                          disabled={safeSelectedIndex === images.length - 1}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full hover:bg-[#1f1f23] transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <Image
                    src="https://via.placeholder.com/800?text=No+Image"
                    alt="No image"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${
                        safeSelectedIndex === idx
                          ? 'border-[#6366f1] ring-2 ring-[#6366f1]/30 scale-105'
                          : 'border-[#26262b] hover:border-[#6366f1]/50'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
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
                <button
                  onClick={async () => {
                    const url = window.location.href;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: product.title, url });
                      } catch { /* cancelled */ }
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Посилання скопійовано');
                    }
                  }}
                  className="p-2.5 rounded-xl border border-[#26262b] text-muted hover:text-white hover:border-purple-500/50 transition-all shrink-0 min-w-[44px] min-h-[44px]"
                  title="Поділитися"
                >
                  <Share2 size={20} />
                </button>
              </div>

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
                  <span className="text-[#9ca3af] text-sm">⭐ Немає відгуків</span>
                )}
              </div>

              <div className="mb-6">
                {product.discountPrice && product.originalPrice && !selectedVariant ? (
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {Number(effectivePrice).toLocaleString('uk-UA')} ₴
                    </span>
                    <span className="text-xl text-[#9ca3af] line-through">
                      {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                ) : (
                  <p className="text-4xl font-light text-white">
                    {Number(effectivePrice).toLocaleString('uk-UA')} ₴
                  </p>
                )}
              </div>

              <div className="mb-6 space-y-3">
                <div className={`flex items-center gap-2 ${effectiveStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <Check size={20} strokeWidth={2} />
                  <span className="text-sm font-medium">
                    {effectiveStock > 0 ? (
                      <>
                        В наявності
                        {effectiveStock <= 10 && (
                          <span className="ml-2 text-orange-400">⚡ Залишилось лише {effectiveStock} шт.</span>
                        )}
                      </>
                    ) : 'Немає в наявності'}
                  </span>
                </div>

                {effectiveStock > 0 && effectiveStock <= 15 && (
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

                <div className="flex items-center gap-2 text-green-400">
                  <Truck size={16} />
                  <span className="text-xs font-medium">Безкоштовна доставка при замовленні від 5000 ₴</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-8">
                <div className="flex gap-1 border-b border-[#26262b] mb-6 overflow-x-auto whitespace-nowrap flex-nowrap">
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
                            const el = document.getElementById('reviews-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }
                      }}
                      className={`px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium transition-all relative ${
                        activeTab === tab.key ? 'text-white' : 'text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'description' && (
                  product.description ? (
                    <DescriptionRenderer description={product.description} />
                  ) : (
                    <p className="text-[#9ca3af]">Опис товару скоро з&apos;явиться. Зверніться до менеджера для отримання деталей.</p>
                  )
                )}

                {activeTab === 'specs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ['Тип товару', 'Електроніка'],
                      ['Гарантія', '12 місяців'],
                      ['Доставка', 'Нова Пошта, 1–3 дні'],
                      ['Повернення', '14 днів'],
                      ['Оплата', 'При отриманні / Онлайн'],
                      ['Стан', 'Новий'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between p-3 bg-[#1f1f23] rounded-lg">
                        <span className="text-[#9ca3af] text-sm">{label}</span>
                        <span className="text-white text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && <div id="reviews-inline" />}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Truck size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs sm:text-sm text-[#9ca3af]">Швидка доставка</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Shield size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs sm:text-sm text-[#9ca3af]">Підтримка клієнтів</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <RotateCcw size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs sm:text-sm text-[#9ca3af]">Повернення 14 днів</span>
                </div>
              </div>

              <div className="space-y-4 mt-auto">
                {/* Variant Selector */}
                {(finalOptions.length > 0 || finalVariants.length > 0) && (
                  <VariantSelector
                    options={finalOptions}
                    variants={finalVariants}
                    selectedOptions={selectedOptions}
                    onOptionSelect={handleOptionSelect}
                    selectedVariant={selectedVariant}
                  />
                )}

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
                      onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                      className="px-4 py-3 bg-[#1f1f23] hover:bg-[#26262b] transition-colors"
                      disabled={quantity >= effectiveStock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  data-add-to-cart-btn
                  onClick={handleAddToCart}
                  disabled={effectiveStock === 0}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  {effectiveStock > 0 ? 'Купити' : 'Товар недоступний'}
                </button>

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
              <h2 className="text-3xl font-light text-white">
                Відгуки {reviewsTotal > 0 && <span className="text-[#9ca3af] text-xl">({reviewsTotal})</span>}
              </h2>
              <div className="flex items-center gap-4">
                <label className="text-sm text-[#9ca3af]">Сортування:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
                  className="input-field py-2.5 px-3 text-sm"
                >
                  <option value="newest">Найновіші</option>
                  <option value="best">Найкращі</option>
                  <option value="worst">Найгірші</option>
                </select>
              </div>
            </div>

            {/* Loading skeleton */}
            {reviewsLoading ? (
              <div className="space-y-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <ReviewSkeleton key={i} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-[#9ca3af]">
                            {new Date(review.createdAt).toLocaleDateString('uk-UA', {
                              day: 'numeric', month: 'numeric', year: 'numeric',
                            })}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="p-1 text-[#6b7280] hover:text-red-400 transition-colors"
                              title="Видалити відгук"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-[#9ca3af] text-sm leading-relaxed mb-3">{review.comment}</p>
                      )}

                      {/* Переваги */}
                      {review.pros && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Переваги</span>
                              <p className="text-sm text-[#9ca3af] mt-1 leading-relaxed whitespace-pre-line">{review.pros}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Недоліки */}
                      {review.cons && (
                        <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Недоліки</span>
                              <p className="text-sm text-[#9ca3af] mt-1 leading-relaxed whitespace-pre-line">{review.cons}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Фото відгуку */}
                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {review.images.map((img) => (
                            <button
                              key={img.id}
                              onClick={() => openImagePreview(img.imageUrl)}
                              className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[#26262b] hover:border-[#6366f1] transition-colors shrink-0"
                            >
                              <Image
                                src={img.imageUrl}
                                alt="Фото з відгуку"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Показати ще */}
                {hasMoreReviews && (
                  <div className="flex justify-center mb-8">
                    <button
                      onClick={loadMoreReviews}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      Показати ще відгуки
                    </button>
                  </div>
                )}

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

        {/* Cross-sell */}
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
                  <div className="aspect-square overflow-hidden bg-[#1f1f23] rounded-xl relative">
                    <Image
                      src={rp.imageUrl || '/placeholder.jpg'}
                      alt={rp.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
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
                        <span className="text-xs sm:text-sm text-[#9ca3af] line-through">
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
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Ім&apos;я</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Ваше ім&apos;я"
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
              <div>
                <label className="block text-sm font-medium text-emerald-400 mb-2">
                  ✓ Переваги <span className="text-[#6b7280] font-light">(необов&apos;язково)</span>
                </label>
                <textarea
                  value={newPros}
                  onChange={(e) => setNewPros(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Що вам сподобалось..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">
                  ✗ Недоліки <span className="text-[#6b7280] font-light">(необов&apos;язково)</span>
                </label>
                <textarea
                  value={newCons}
                  onChange={(e) => setNewCons(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Що не сподобалось..."
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                  Додати фото <span className="text-[#6b7280] font-light">(макс. 5, JPG/PNG/WebP, до 5MB)</span>
                </label>
                <div className="mb-3 flex items-center justify-between rounded-xl border border-[#26262b] bg-[#131317] px-3 py-2 text-xs text-[#9ca3af]">
                  <span className="inline-flex items-center gap-2">
                    <ImageIcon size={14} />
                    Фото зʼявиться одразу після вибору
                  </span>
                  <span className="rounded-full border border-[#26262b] bg-[#18181c] px-2.5 py-1 font-medium text-white">
                    {newReviewImages.length}/{MAX_REVIEW_IMAGES}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* Existing previews */}
                  {newReviewImagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#26262b] group">
                      <Image
                        src={preview}
                        alt={`Прев'ю ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index)}
                        className="absolute top-1 right-1 p-1 bg-[#0f0f12]/80 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Upload button */}
                  {newReviewImages.length < MAX_REVIEW_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#3f3f46] bg-[#131317] text-[#6b7280] transition-all duration-300 hover:border-[#6366f1]/50 hover:bg-[#18181c] hover:text-[#9ca3af]"
                    >
                      <Upload size={18} />
                      <span className="text-[10px]">+ Фото</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleReviewImageSelect}
                  className="hidden"
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

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0f0f12]/90 backdrop-blur-sm"
            onClick={closeImagePreview}
          />
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={closeImagePreview}
              className="absolute -top-12 right-0 p-2 text-white hover:text-[#6366f1] transition-colors"
            >
              <X size={28} />
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={previewImageUrl}
                alt="Прев'ю фото"
                width={1200}
                height={1200}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Buy Popup */}
      {showBuyPopup && (
        <BuyPopup
          title={product.title}
          price={Number(effectivePrice)}
          imageUrl={effectiveImage[0] || null}
          quantity={quantity}
          variantOptions={selectedVariant ? (selectedVariant.options as VariantOption[]).map((o) => ({ name: o.name, value: o.value })) : undefined}
          onClose={() => setShowBuyPopup(false)}
        />
      )}
    </main>
  );
}
