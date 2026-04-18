'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ordersApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NovaPoshtaSelector from '@/components/NovaPoshtaSelector';
import { useCheckoutStorage, CheckoutData } from '@/hooks/useCheckoutStorage';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/image-utils';
import { ArrowLeft, ShoppingCart, ShieldCheck, User, MapPin, CreditCard, Tag, Check, X } from 'lucide-react';

// ===== TYPES =====
interface City {
  label: string;
  ref: string;
  description?: string;
  region?: string;
  area?: string;
}

interface Warehouse {
  id: string;
  label: string;
  number: string;
  shortAddress: string;
  type: string;
  latitude?: string;
  longitude?: string;
  schedule?: string;
}

interface CheckoutForm {
  firstName: string;
  surname: string;
  phone: string;
  comment?: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutForm>();

  const { savedData, isLoaded, saveData } = useCheckoutStorage();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved data
  useEffect(() => {
    if (isLoaded && savedData) {
      if (savedData.surname) setValue('surname', savedData.surname);
      if (savedData.firstName) setValue('firstName', savedData.firstName);
      if (savedData.phone) setValue('phone', savedData.phone);
    }
  }, [isLoaded, savedData, setValue]);

  // Save form data with debounce
  const saveFormData = useCallback((data: CheckoutData) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveData(data), 1000);
  }, [saveData]);

  useEffect(() => {
    if (!isLoaded) return;
    const dataToSave: CheckoutData = {
      surname: watch('surname') || '',
      firstName: watch('firstName') || '',
      phone: watch('phone') || '',
      city: selectedCity?.label || null,
      cityRef: selectedCity?.ref || null,
      warehouse: selectedWarehouse?.number || null,
      warehouseAddress: selectedWarehouse?.shortAddress || null,
    };
    saveFormData(dataToSave);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [isLoaded, watch('surname'), watch('firstName'), watch('phone'), selectedCity?.label, selectedCity?.ref, selectedWarehouse?.number, selectedWarehouse?.shortAddress, saveFormData]);

  // Ukrainian phone validation
  const ukrainianPhoneRegex = /^(\+380|380|0)\d{9}$/;

  // Promo code handlers
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setValidatingPromo(true);
    setPromoError('');

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          orderTotal: getTotal(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPromoError(data.error || 'Промокод недійсний');
        return;
      }

      setDiscount(data.discount);
      setAppliedPromoCode(promoCode);
      setPromoApplied(true);
      toast.success(`Промокод застосовано! Знижка: ${data.discount} ₴`);
    } catch (error) {
      setPromoError('Помилка перевірки промокоду');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoApplied(false);
    setAppliedPromoCode('');
    setDiscount(0);
    setPromoError('');
  };

  const onSubmit = async (data: CheckoutForm) => {
    // Validation
    if (!data.firstName?.trim()) {
      toast.error('Введіть ім\'я');
      return;
    }
    if (!data.surname?.trim()) {
      toast.error('Введіть прізвище');
      return;
    }
    if (!selectedCity) {
      toast.error('Оберіть місто');
      return;
    }
    if (!selectedWarehouse) {
      toast.error('Оберіть відділення');
      return;
    }

    // Validate phone format
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!ukrainianPhoneRegex.test(cleanPhone)) {
      toast.error('Введіть номер у форматі +380XXXXXXXXX');
      return;
    }

    try {
      setLoading(true);
      const fullName = `${data.surname} ${data.firstName}`.trim();
      const orderData = {
        name: fullName,
        phone: cleanPhone,
        city: selectedCity.label,
        warehouse: `${selectedWarehouse.type} №${selectedWarehouse.number}`,
        warehouseAddress: selectedWarehouse.shortAddress,
        comment: data.comment,
        paymentMethod,
        promoCode: promoApplied ? appliedPromoCode : null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || null,
          variantOptions: item.variantOptions || null,
        })),
      };

      // Retry logic for race condition
      const MAX_RETRIES = 2;
      let lastError: any;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await ordersApi.create(orderData);

          // Clear cart only after successful response
          clearCart();
          saveData({
            surname: '', firstName: '',
            phone: '', city: null, cityRef: null, warehouse: null, warehouseAddress: null
          });

          const orderNumber = response.data?.orderNumber || response.data?.id;
          router.push(`/orders/success?order=${orderNumber}`);
          return;
        } catch (err: any) {
          lastError = err;

          const isRetryable =
            err.response?.status === 409 ||
            err.response?.data?.retryable === true ||
            err.response?.data?.error?.includes('недоступний') ||
            err.response?.data?.error?.includes('Товар') ||
            err.response?.status === 500;

          if (!isRetryable || attempt === MAX_RETRIES) {
            throw err;
          }

          const delay = Math.pow(2, attempt - 1) * 200 + Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message;

      if (errorMsg?.includes('недоступний') || errorMsg?.includes('Товар')) {
        toast.error('На жаль, товар вже закінчився. Видаліть його з кошика та спробуйте знову.');
      } else if (error.response?.status === 429) {
        toast.error('Занадто багато спроб. Зачекайте хвилину та спробуйте знову.');
      } else {
        toast.error(errorMsg || 'Помилка при оформленні замовлення. Спробуйте ще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = useCallback((city: City | null) => setSelectedCity(city), []);
  const handleWarehouseChange = useCallback((warehouse: Warehouse | null) => setSelectedWarehouse(warehouse), []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <div className="text-center py-20">
            <ShoppingCart size={48} className="mx-auto text-[#9ca3af] mb-6" />
            <h1 className="text-3xl font-light mb-4">Кошик порожній</h1>
            <p className="text-muted mb-8">Додай товари перед оформленням замовлення</p>
            <button onClick={() => router.push('/catalog')} className="btn-primary inline-flex items-center gap-2">
              <ShoppingCart size={20} />
              Перейти до каталогу
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-6xl">
        {/* Back button */}
        <button
          onClick={() => router.push('/cart')}
          className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors duration-200 mb-6 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-light">Повернутися до кошика</span>
        </button>

        <h1 className="text-3xl font-light mb-8">Оформлення замовлення</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Section 1: Contact Info */}
                <div className="space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <User size={20} className="text-purple-400" />
                    Контактні дані
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ім'я *</label>
                      <input
                        {...register('firstName', { required: "Обов'язкове" })}
                        className="input-field"
                        placeholder="Іван"
                      />
                      {errors.firstName && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Прізвище *</label>
                      <input
                        {...register('surname', { required: "Обов'язкове" })}
                        className="input-field"
                        placeholder="Іванов"
                      />
                      {errors.surname && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.surname.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Телефон *</label>
                    <input
                      {...register('phone', {
                        required: "Обов'язковий",
                        pattern: {
                          value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                          message: 'Некоректний номер телефону'
                        }
                      })}
                      className="input-field"
                      placeholder="+380 (XX) XXX-XX-XX"
                    />
                    {errors.phone && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Section 2: Delivery */}
                <div className="space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <MapPin size={20} className="text-purple-400" />
                    Доставка
                  </h2>
                  <NovaPoshtaSelector
                    onCityChange={handleCityChange}
                    onWarehouseChange={handleWarehouseChange}
                    selectedCity={selectedCity}
                    selectedWarehouse={selectedWarehouse}
                    savedCityName={savedData?.city}
                  />
                </div>

                {/* Section 3: Payment */}
                <div className="space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <CreditCard size={20} className="text-purple-400" />
                    Спосіб оплати
                  </h2>

                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'CARD')}
                        className="mt-1 w-4 h-4 accent-purple-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-white text-sm">Оплата при отриманні</span>
                        <p className="text-xs text-orange-400 mt-1">
                          Комісія Нової Пошти: 2% + 20 грн
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARD"
                        checked={paymentMethod === 'CARD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'CARD')}
                        className="mt-1 w-4 h-4 accent-purple-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-white text-sm">Повна передоплата на карту</span>
                        <p className="text-xs text-green-400 mt-1">
                          Без комісії — переказ через менеджера
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section 3.5: Promo Code */}
                <div className="space-y-4">
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Tag size={20} className="text-purple-400" />
                    Промокод
                  </h2>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Введіть промокод"
                      className="input-field flex-1"
                      disabled={promoApplied}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={!promoCode || promoApplied || validatingPromo}
                      className="btn-secondary px-6 whitespace-nowrap"
                    >
                      {validatingPromo ? 'Перевірка...' : promoApplied ? '✓ Застосовано' : 'Застосувати'}
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-red-400 text-sm">{promoError}</p>
                  )}

                  {promoApplied && discount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Check size={16} className="text-green-400" />
                      <span className="text-sm text-green-400 flex-1">
                        Промокод "{appliedPromoCode}" застосовано! Знижка: {discount.toLocaleString('uk-UA')} ₴
                      </span>
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="text-muted hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 4: Comment */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium">Коментар до замовлення (необов'язково)</label>
                  <textarea
                    {...register('comment')}
                    className="input-field"
                    rows={3}
                    placeholder="Додаткова інформація для менеджера..."
                  />
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                  <ShieldCheck size={24} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Безпечне оформлення</p>
                    <p className="text-xs sm:text-sm text-[#9ca3af]">Менеджер зв'яжеться для підтвердження</p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 text-base disabled:opacity-50"
                >
                  {loading ? 'Оформлення...' : `Оформити замовлення на ${(getTotal() - discount).toLocaleString('uk-UA')} ₴`}
                </button>

                <p className="text-xs sm:text-sm text-muted text-center">
                  Натискаючи &quot;Оформити замовлення&quot;, ви погоджуєтесь з умовами доставки та оплати
                </p>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-light mb-6">Твоє замовлення</h2>

              <div className="mb-6">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex gap-3 p-3 rounded-lg bg-surfaceLight/50">
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md bg-surfaceLight relative">
                        <Image
                          src={normalizeImageUrl(item.imageUrl)}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate mb-1">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{item.quantity} шт.</span>
                          <span>×</span>
                          <span>{item.price.toLocaleString('uk-UA')} ₴</span>
                        </div>
                      </div>
                      <div className="font-medium text-sm whitespace-nowrap">
                        {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Товари:</span>
                  <span className="font-medium">{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Доставка:</span>
                  <span className="font-medium text-purple-400">за тарифами НП</span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Комісія НП:</span>
                    <span className="font-medium text-orange-400">2% + 20 ₴</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Знижка ({appliedPromoCode}):</span>
                    <span className="font-medium text-green-400">-{discount.toLocaleString('uk-UA')} ₴</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">Разом:</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {(getTotal() - discount).toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                </div>
              </div>

              {(getTotal() - discount) < 5000 && (
                <div className="mt-4 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                  <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                    💡 До безкоштовної доставки ще {(5000 - (getTotal() - discount)).toLocaleString('uk-UA')} ₴
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-4 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                <span className="text-purple-400 text-sm shrink-0 mt-0.5">ⓘ</span>
                <span className="text-xs text-muted leading-relaxed">
                  Вартість доставки оплачується окремо при отриманні
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
