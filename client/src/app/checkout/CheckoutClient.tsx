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
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Truck, CreditCard, User, MapPin } from 'lucide-react';

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
  surname: string;
  firstName: string;
  middleName: string;
  phone: string;
  comment?: string;
}

// ===== STEPS CONFIG =====
const STEPS = [
  { key: 'contact', label: 'Контакти', icon: User },
  { key: 'delivery', label: 'Доставка', icon: MapPin },
  { key: 'payment', label: 'Оплата', icon: CreditCard },
  { key: 'confirm', label: 'Підтвердження', icon: Check },
];

export default function CheckoutClient() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [currentStep, setCurrentStep] = useState(0);

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
      if (savedData.middleName) setValue('middleName', savedData.middleName);
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
      middleName: watch('middleName') || '',
      phone: watch('phone') || '',
      city: selectedCity?.label || null,
      cityRef: selectedCity?.ref || null,
      warehouse: selectedWarehouse?.number || null,
      warehouseAddress: selectedWarehouse?.shortAddress || null,
    };
    saveFormData(dataToSave);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [isLoaded, selectedCity?.label, selectedCity?.ref, selectedWarehouse?.number, selectedWarehouse?.shortAddress]);

  // ✅ Ukrainian phone validation
  const ukrainianPhoneRegex = /^(\+380|380|0)\d{9}$/;

  const onSubmit = async (data: CheckoutForm) => {
    if (!selectedCity) { toast.error('Оберіть місто'); setCurrentStep(1); return; }
    if (!selectedWarehouse) { toast.error('Оберіть відділення'); setCurrentStep(1); return; }

    // Validate phone format
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!ukrainianPhoneRegex.test(cleanPhone)) {
      toast.error('Введіть номер у форматі +380XXXXXXXXX');
      return;
    }

    try {
      setLoading(true);
      const fullName = `${data.surname} ${data.firstName} ${data.middleName}`.trim();
      const orderData = {
        name: fullName,
        phone: cleanPhone,
        city: selectedCity.label,
        warehouse: `${selectedWarehouse.type} №${selectedWarehouse.number}`,
        warehouseAddress: selectedWarehouse.shortAddress,
        comment: data.comment,
        paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      const response = await ordersApi.create(orderData);
      clearCart();
      saveData({
        surname: '', firstName: '', middleName: '',
        phone: '', city: null, cityRef: null, warehouse: null, warehouseAddress: null
      });
      const orderNumber = response.data?.orderNumber || response.data?.id;
      router.push(`/orders/success?order=${orderNumber}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при оформленні замовлення');
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = useCallback((city: City | null) => setSelectedCity(city), []);
  const handleWarehouseChange = useCallback((warehouse: Warehouse | null) => setSelectedWarehouse(warehouse), []);

  // Auto-advance step based on form completion
  const canProceedToDelivery = watch('surname') && watch('firstName') && watch('phone');
  const canProceedToPayment = canProceedToDelivery && selectedCity && selectedWarehouse;

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
      <main className="flex-1 container mx-auto px-4 py-8 mt-20 max-w-5xl">
        {/* Back button */}
        <button
          onClick={() => router.push('/cart')}
          className="inline-flex items-center gap-2 text-muted hover:text-purple-400 transition-colors duration-200 mb-6 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-light">Повернутися до кошика</span>
        </button>

        <h1 className="text-3xl font-light mb-8">Оформлення замовлення</h1>

        {/* ✅ Progress Steps */}
        <div className="flex items-center justify-between mb-10 px-4">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-[#1f1f23] text-[#9ca3af] border border-[#26262b]'
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'text-white' : 'text-[#9ca3af]'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mb-6 ${
                    isCompleted ? 'bg-green-500' : 'bg-[#26262b]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <div className="card p-6" style={{ overflow: 'visible', position: 'relative' }}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Contact Info */}
                <div className={currentStep === 0 ? 'block' : 'hidden'}>
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <User size={20} className="text-purple-400" />
                    Контактні дані
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Прізвище *</label>
                        <input
                          {...register('surname', { required: "Обов'язкове" })}
                          className="input-field"
                          placeholder="Іванов"
                        />
                        {errors.surname && <p className="text-red-400 text-xs mt-1">{errors.surname.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ім&apos;я *</label>
                        <input
                          {...register('firstName', { required: "Обов'язкове" })}
                          className="input-field"
                          placeholder="Іван"
                        />
                        {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">По-батькові</label>
                      <input {...register('middleName')} className="input-field" placeholder="Іванович" />
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
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (canProceedToDelivery) {
                        setCurrentStep(1);
                        toast.success('Контакти збережено');
                      } else {
                        toast.error("Заповніть обов'язкові поля");
                      }
                    }}
                    className="btn-primary w-full mt-6"
                  >
                    Далі → Доставка
                  </button>
                </div>

                {/* Step 2: Delivery */}
                <div className={currentStep === 1 ? 'block' : 'hidden'}>
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-purple-400" />
                    Доставка Новою Поштою
                  </h2>
                  <NovaPoshtaSelector
                    onCityChange={handleCityChange}
                    onWarehouseChange={handleWarehouseChange}
                    selectedCity={selectedCity}
                    selectedWarehouse={selectedWarehouse}
                    savedCityName={savedData?.city}
                  />
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="btn-secondary flex-1"
                    >
                      ← Назад
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (canProceedToPayment) {
                          setCurrentStep(2);
                          toast.success('Доставку обрано');
                        } else {
                          toast.error('Оберіть місто та відділення');
                        }
                      }}
                      className="btn-primary flex-1"
                    >
                      Далі → Оплата
                    </button>
                  </div>
                </div>

                {/* Step 3: Payment */}
                <div className={currentStep === 2 ? 'block' : 'hidden'}>
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-purple-400" />
                    Спосіб оплати
                  </h2>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Коментар до замовлення</label>
                    <textarea
                      {...register('comment')}
                      className="input-field"
                      rows={2}
                      placeholder="Додаткова інформація"
                    />
                  </div>

                  {/* Payment Methods */}
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
                        <p className="text-xs text-muted mt-0.5">Накладений платіж на Новій Пошті</p>
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
                        <p className="text-xs text-muted mt-0.5">Переказ на банківську карту через менеджера</p>
                      </div>
                    </label>
                  </div>

                  {/* ✅ Payment Icons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-purple-500/10">
                    <span className="text-xs text-[#9ca3af]">Підтримуємо:</span>
                    <div className="flex items-center gap-1.5">
                      {['Visa', 'MC', 'Apple', 'Google'].map((brand) => (
                        <span key={brand} className="px-2 py-0.5 bg-[#1f1f23] rounded text-[10px] text-[#9ca3af] font-medium border border-[#26262b]">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setCurrentStep(1)} className="btn-secondary flex-1">
                      ← Назад
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="btn-primary flex-1"
                    >
                      Підтвердити
                    </button>
                  </div>
                </div>

                {/* Step 4: Confirm */}
                <div className={currentStep === 3 ? 'block' : 'hidden'}>
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <Check size={20} className="text-purple-400" />
                    Підтвердження замовлення
                  </h2>

                  {/* Order Summary */}
                  <div className="space-y-3 p-4 bg-[#1f1f23] rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9ca3af]">Отримувач:</span>
                      <span className="text-white">{watch('surname')} {watch('firstName')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9ca3af]">Телефон:</span>
                      <span className="text-white">{watch('phone')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9ca3af]">Місто:</span>
                      <span className="text-white">{selectedCity?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9ca3af]">Відділення:</span>
                      <span className="text-white">{selectedWarehouse?.shortAddress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9ca3af]">Оплата:</span>
                      <span className="text-white">{paymentMethod === 'COD' ? 'При отриманні' : 'Онлайн'}</span>
                    </div>
                  </div>

                  {/* ✅ Security Badge */}
                  <div className="flex items-center gap-3 mt-4 p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                    <ShieldCheck size={24} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Безпечне оформлення</p>
                      <p className="text-xs text-[#9ca3af]">Менеджер зв&apos;яжеться для підтвердження</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setCurrentStep(2)} className="btn-secondary flex-1">
                      ← Назад
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {loading ? 'Оформлення...' : `Замовити на ${getTotal().toLocaleString('uk-UA')} ₴`}
                    </button>
                  </div>

                  <p className="text-xs text-muted text-center mt-4">
                    Натискаючи &quot;Замовити&quot;, ви погоджуєтесь з умовами доставки та оплати
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-light mb-6">Твоє замовлення</h2>

              <div className="mb-6">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 p-3 rounded-lg bg-surfaceLight/50">
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md bg-surfaceLight relative">
                        <Image
                          src={item.imageUrl || '/placeholder.jpg'}
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
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium">Разом:</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {getTotal().toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                </div>
              </div>

              {getTotal() < 5000 && (
                <div className="mt-4 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    До безкоштовної доставки ще {(5000 - getTotal()).toLocaleString('uk-UA')} ₴
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
