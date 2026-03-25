'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ordersApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NovaPoshtaSelector from '@/components/NovaPoshtaSelector';
import { useCheckoutStorage } from '@/hooks/useCheckoutStorage';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface City {
  Ref: string;
  Description: string;
  RegionDescription: string;
  AreaDescription?: string;
}

interface Warehouse {
  Ref: string;
  Description: string;
  ShortAddress: string;
  Number: string;
  Latitude?: string;
  Longitude?: string;
}

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  comment?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutForm>();

  const formData = watch();
  const { savedData, isLoaded, saveData } = useCheckoutStorage();

  // Завантаження збережених даних при монтажі
  useEffect(() => {
    if (isLoaded && savedData) {
      if (savedData.name) setValue('name', savedData.name);
      if (savedData.phone) setValue('phone', savedData.phone);
      if (savedData.email) setValue('email', savedData.email);
    }
  }, [isLoaded, savedData, setValue]);

  // Збереження даних при зміні форми
  useEffect(() => {
    if (isLoaded && formData) {
      saveData({
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email || '',
        city: selectedCity?.Description || null,
        warehouse: selectedWarehouse?.Number || null,
        warehouseAddress: selectedWarehouse?.ShortAddress || null,
      });
    }
  }, [formData, selectedCity, selectedWarehouse, isLoaded]);

  // Відновлення даних міста та відділення
  useEffect(() => {
    if (isLoaded && savedData?.city) {
      // Місто буде відновлено через NovaPoshtaSelector
      // Відділення буде відновлено після завантаження списку відділень
    }
  }, [isLoaded, savedData]);

  const onSubmit = async (data: CheckoutForm) => {
    if (!selectedCity) {
      toast.error('Оберіть місто');
      return;
    }
    if (!selectedWarehouse) {
      toast.error('Оберіть відділення');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        ...data,
        city: selectedCity.Description,
        warehouse: `Відділення №${selectedWarehouse.Number}`,
        warehouseAddress: selectedWarehouse.ShortAddress,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      await ordersApi.create(orderData);
      clearCart();
      saveData({ name: '', phone: '', email: '', city: null, warehouse: null, warehouseAddress: null });
      toast.success('Замовлення успішно оформлено!');
      router.push('/orders/success');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при оформленні замовлення');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-3xl font-light mb-4">Кошик порожній</h1>
            <p className="text-muted mb-8">Додай товари перед оформленням замовлення</p>
            <Link href="/catalog" className="btn-primary">Перейти до каталогу</Link>
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
        <h1 className="text-3xl font-light mb-8">Оформлення замовлення</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-light mb-6">Контактні дані</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ПІБ *</label>
                <input {...register('name', { required: 'Ім&apos;я обов&apos;язкове' })} className="input-field" placeholder="Іванов Іван Іванович" />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Телефон *</label>
                <input {...register('phone', { required: 'Телефон обов&apos;язковий', minLength: { value: 5, message: 'Некоректний номер телефону' } })} className="input-field" placeholder="+38 (0XX) XXX-XX-XX" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input {...register('email', { required: 'Email обов&apos;язковий', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Некоректний email' } })} className="input-field" placeholder="example@mail.com" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div className="border-t border-purple-500/20 pt-4">
                <NovaPoshtaSelector
                  onCityChange={setSelectedCity}
                  onWarehouseChange={setSelectedWarehouse}
                  selectedCity={selectedCity}
                  selectedWarehouse={selectedWarehouse}
                  savedCityName={savedData?.city}
                  savedWarehouseNumber={savedData?.warehouse}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Коментар до замовлення</label>
                <textarea {...register('comment')} className="input-field" rows={2} placeholder="Додаткова інформація" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Оформлення...' : `Замовити на ${getTotal().toLocaleString('uk-UA')} ₴`}
              </button>
            </form>
          </div>
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-light mb-4">Твоє замовлення</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-surfaceLight">
                      <img src={item.imageUrl || '/placeholder.jpg'} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-muted text-sm">{item.quantity} шт. × {item.price.toLocaleString('uk-UA')} ₴</p>
                    </div>
                    <div className="font-medium">{(item.price * item.quantity).toLocaleString('uk-UA')} ₴</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-muted">
                  <span>Товари:</span>
                  <span>{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Доставка:</span>
                  <span className="text-green-500">Безкоштовно</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-lg font-medium">
                  <span>Разом:</span>
                  <span>{getTotal().toLocaleString('uk-UA')} ₴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
