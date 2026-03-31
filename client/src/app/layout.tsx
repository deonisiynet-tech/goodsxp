import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import AnalyticsTracker from '@/components/AnalyticsTracker';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'GoodsXP | Сучасна електроніка',
  description: 'Інтернет-магазин сучасної електроніки та гаджетів. Гарантія якості, швидка доставка по Україні.',
  keywords: ['електроніка', 'гаджети', 'смартфони', 'ноутбуки', 'навушники', 'Україна'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <Providers>
          {/* Відстеження відвідувачів */}
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
