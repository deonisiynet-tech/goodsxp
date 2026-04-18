'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminApiFullPath } from '@/lib/admin-paths';

interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  validityType: 'DAYS' | 'HOURS' | 'DATE_RANGE';
  duration?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  maxUsageCount?: number | null;
  currentUsage: number;
  isActive: boolean;
}

interface PromoCodeModalProps {
  promoCode?: PromoCode | null;
  onClose: () => void;
}

export default function PromoCodeModal({ promoCode, onClose }: PromoCodeModalProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [validityType, setValidityType] = useState<'DAYS' | 'HOURS' | 'DATE_RANGE'>('DAYS');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUsageCount, setMaxUsageCount] = useState('');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promoCode) {
      setCode(promoCode.code);
      setType(promoCode.type);
      setValue(String(promoCode.value));
      setValidityType(promoCode.validityType);
      setDuration(promoCode.duration ? String(promoCode.duration) : '');
      setStartDate(promoCode.startDate ? promoCode.startDate.split('T')[0] : '');
      setEndDate(promoCode.endDate ? promoCode.endDate.split('T')[0] : '');
      setMaxUsageCount(promoCode.maxUsageCount ? String(promoCode.maxUsageCount) : '');
      setIsUnlimited(promoCode.maxUsageCount === null);
      setIsActive(promoCode.isActive);
    }
  }, [promoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!code.trim()) {
        toast.error('Введіть код промокоду');
        return;
      }

      if (!/^[A-Z0-9_-]+$/i.test(code)) {
        toast.error('Код може містити тільки літери, цифри, дефіси та підкреслення');
        return;
      }

      if (!value || Number(value) <= 0) {
        toast.error('Значення має бути більше 0');
        return;
      }

      if (type === 'PERCENTAGE' && Number(value) > 100) {
        toast.error('Відсоток не може перевищувати 100');
        return;
      }

      if ((validityType === 'DAYS' || validityType === 'HOURS') && (!duration || Number(duration) <= 0)) {
        toast.error('Вкажіть тривалість');
        return;
      }

      if (validityType === 'DATE_RANGE') {
        if (!startDate || !endDate) {
          toast.error('Вкажіть дати початку та закінчення');
          return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
          toast.error('Дата закінчення має бути пізніше дати початку');
          return;
        }
      }

      const data = {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        validityType,
        duration: (validityType === 'DAYS' || validityType === 'HOURS') ? Number(duration) : null,
        startDate: validityType === 'DATE_RANGE' ? startDate : null,
        endDate: validityType === 'DATE_RANGE' ? endDate : null,
        maxUsageCount: isUnlimited ? null : Number(maxUsageCount),
        isActive,
      };

      const url = promoCode
        ? getAdminApiFullPath(`/promo-codes/${promoCode.id}`)
        : getAdminApiFullPath('/promo-codes');

      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];

      const response = await fetch(url, {
        method: promoCode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Помилка збереження промокоду');
      }

      toast.success(promoCode ? 'Промокод оновлено' : 'Промокод створено');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-white">
            {promoCode ? 'Редагувати промокод' : 'Створити промокод'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-2">Код промокоду *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="SALE10"
              required
            />
            <p className="text-xs text-muted mt-1">Тільки літери, цифри, дефіси та підкреслення</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип знижки *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="PERCENTAGE"
                  checked={type === 'PERCENTAGE'}
                  onChange={(e) => setType(e.target.value as 'PERCENTAGE')}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>Відсоток (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="FIXED"
                  checked={type === 'FIXED'}
                  onChange={(e) => setType(e.target.value as 'FIXED')}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>Фіксована сума (₴)</span>
              </label>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Значення знижки * {type === 'PERCENTAGE' ? '(%)' : '(₴)'}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-field"
              placeholder={type === 'PERCENTAGE' ? '10' : '100'}
              min="0"
              max={type === 'PERCENTAGE' ? '100' : undefined}
              step={type === 'PERCENTAGE' ? '1' : '0.01'}
              required
            />
          </div>

          {/* Validity Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип дійсності *</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="DAYS"
                  checked={validityType === 'DAYS'}
                  onChange={(e) => setValidityType(e.target.value as 'DAYS')}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>Дні</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="HOURS"
                  checked={validityType === 'HOURS'}
                  onChange={(e) => setValidityType(e.target.value as 'HOURS')}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>Години</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="DATE_RANGE"
                  checked={validityType === 'DATE_RANGE'}
                  onChange={(e) => setValidityType(e.target.value as 'DATE_RANGE')}
                  className="w-4 h-4 accent-purple-500"
                />
                <span>Діапазон дат</span>
              </label>
            </div>
          </div>

          {/* Duration (for DAYS/HOURS) */}
          {(validityType === 'DAYS' || validityType === 'HOURS') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Тривалість * ({validityType === 'DAYS' ? 'днів' : 'годин'})
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
                placeholder={validityType === 'DAYS' ? '7' : '24'}
                min="1"
                required
              />
            </div>
          )}

          {/* Date Range */}
          {validityType === 'DATE_RANGE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дата початку *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Дата закінчення *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          )}

          {/* Max Usage Count */}
          <div>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
                className="w-4 h-4 accent-purple-500"
              />
              <span className="text-sm font-medium">Необмежена кількість використань</span>
            </label>
            {!isUnlimited && (
              <input
                type="number"
                value={maxUsageCount}
                onChange={(e) => setMaxUsageCount(e.target.value)}
                className="input-field"
                placeholder="100"
                min="1"
              />
            )}
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-purple-500"
              />
              <span className="text-sm font-medium">Активний</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Збереження...' : promoCode ? 'Оновити' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
