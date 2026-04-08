import type { Metadata } from 'next';
import CartClient from './CartClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export const metadata: Metadata = {
  title: 'Кошик | GoodsXP',
  description: 'Переглянь товари у кошику та оформи замовлення. Доставка Новою Поштою по Україні.',
  alternates: {
    canonical: `${siteUrl}/cart`,
  },
};

export default function CartPage() {
  return <CartClient />;
}
