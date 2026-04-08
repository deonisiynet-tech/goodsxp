import type { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export const metadata: Metadata = {
  title: 'Оформлення замовлення | GoodsXP',
  description: 'Оформи замовлення швидко та зручно. Доставка Новою Поштою, оплата при отриманні або онлайн.',
  alternates: {
    canonical: `${siteUrl}/checkout`,
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
