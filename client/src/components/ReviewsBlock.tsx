'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/api';
import { Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewsBlockProps {
  productId: string;
}

export default function ReviewsBlock({ productId }: ReviewsBlockProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getReviews(productId, sortBy);
      setReviews(response.data.reviews);
      setAverageRating(response.data.averageRating);
      setTotalReviews(response.data.totalReviews);
    } catch (error) {
      toast.error('Помилка завантаження відгуків');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Введіть ваше ім'я");
      return;
    }
    
    if (formData.rating < 1 || formData.rating > 5) {
      toast.error('Оберіть рейтинг від 1 до 5');
      return;
    }

    try {
      setSubmitting(true);
      await productsApi.createReview(productId, {
        name: formData.name,
        rating: formData.rating,
        comment: formData.comment || undefined,
      });
      
      toast.success('Відгук додано!');
      setShowForm(false);
      setFormData({ name: '', rating: 5, comment: '' });
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Помилка додавання відгуку');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, interactive = false, size = 16 }: { rating: number; interactive?: boolean; size?: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => setFormData({ ...formData, rating: star })}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={size}
              className={`${
                star <= formData.rating
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-gray-600 text-gray-600'
              }`}
            />
          </button>
        ) : (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'fill-gray-600 text-gray-600'
            }`}
          />
        )
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="mt-16 border-t border-border pt-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">Відгуки покупців</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-dark flex items-center gap-2 text-sm"
        >
          <Send size={16} />
          Написати відгук
        </button>
      </div>

      {/* Rating Summary */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-light mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(averageRating)} />
            <p className="text-sm text-muted mt-2">
              {totalReviews} {totalReviews === 1 ? 'відгук' : totalReviews < 5 ? 'відгуки' : 'відгуків'}
            </p>
          </div>
          
          {/* Rating Distribution */}
          <div className="flex-1 hidden md:block">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3 mb-1">
                  <span className="text-sm w-3">{rating}</span>
                  <Star size={12} className="fill-yellow-500 text-yellow-500" />
                  <div className="flex-1 h-2 bg-[#1f1f23] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-8 animate-fade-in">
          <h3 className="text-lg font-medium mb-4">Залишити відгук</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted">
                Ваше ім'я *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Введіть ваше ім'я"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted">
                Рейтинг *
              </label>
              <StarRating rating={formData.rating} interactive size={24} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted">
                Коментар
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Поділіться вашим досвідом використання товару"
                disabled={submitting}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Відправка...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Опублікувати
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-dark"
                disabled={submitting}
              >
                Скасувати
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-[#1f1f23] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-[#1f1f23] rounded w-32 mb-2" />
                  <div className="h-3 bg-[#1f1f23] rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-[#1f1f23] rounded mb-2" />
              <div className="h-3 bg-[#1f1f23] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>Відгуків ще немає. Будьте першими!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted">
              {totalReviews} {totalReviews === 1 ? 'відгук' : totalReviews < 5 ? 'відгуки' : 'відгуків'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
              className="input-field text-sm py-2 px-3"
            >
              <option value="date">Спочатку нові</option>
              <option value="rating">Спочатку з високим рейтингом</option>
            </select>
          </div>

          {reviews.map((review) => (
            <div key={review.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium">{review.name}</h4>
                    <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              
              {review.comment && (
                <p className="text-muted leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
