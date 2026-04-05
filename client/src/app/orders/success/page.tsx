import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderNumber from '@/components/OrderNumber';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-24 h-24 border border-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-primary" />
          </div>

          <h1 className="text-3xl font-light mb-4">
            Замовлення успішно оформлено! 🎉
          </h1>

          <p className="text-muted mb-2">
            Дякуємо, що обрали наш магазин.
          </p>
          <p className="text-muted mb-2">
            Ми вже отримали ваше замовлення. Найближчим часом наш менеджер зв&apos;яжеться з вами для підтвердження та підготовки до відправки.
          </p>

          <OrderNumber />

          <div className="space-y-4 mt-8">
            <Link href="/catalog" className="btn-primary w-full inline-block">
              Продовжити покупки
            </Link>
            <Link
              href="/"
              className="block text-sm hover:text-secondary transition-colors"
            >
              <ArrowLeft size={16} className="inline mr-2" />
              Повернутися на головну
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
