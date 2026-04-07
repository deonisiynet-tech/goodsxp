import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import StoreStatusChecker from '@/components/StoreStatusChecker';
import ScrollToTop from '@/components/ScrollToTop';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import CartResumePopup from '@/components/CartResumePopup';
import { generateOrganizationJsonLd, generateWebSiteJsonLd } from '@/lib/schema';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export const metadata: Metadata = {
  title: {
    default: 'GoodsXP — Сучасна електроніка та гаджети з доставкою по Україні',
    template: '%s | GoodsXP',
  },
  description:
    'Інтернет-магазин трендової електроніки: смарт-годинники, навушники, павербанки та аксесуари. ✅ Безпечна оплата ✅ Доставка 1–3 дні Новою Поштою ✅ Гарантія 14 днів на повернення.',
  keywords: [
    'електроніка',
    'гаджети',
    'смарт годинник',
    'навушники',
    'павербанк',
    'аксесуари',
    'GoodsXP',
    'інтернет магазин Україна',
    'доставка Новою Поштою',
  ],
  authors: [{ name: 'GoodsXP' }],
  creator: 'GoodsXP',
  publisher: 'GoodsXP',
  formatDetection: {
    telephone: true,
    email: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GoodsXP',
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: siteUrl,
    siteName: 'GoodsXP',
    title: 'GoodsXP — Сучасна електроніка та гаджети',
    description:
      'Інтернет-магазин трендової електроніки з доставкою по Україні. Безпечна оплата, гарантія якості, швидка доставка.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'GoodsXP — Сучасна електроніка',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoodsXP — Сучасна електроніка та гаджети',
    description: 'Інтернет-магазин трендової електроніки з доставкою по Україні.',
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console — додати після верифікації
    // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd()),
          }}
        />
        {/* JSON-LD: WebSite + SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteJsonLd()),
          }}
        />
        <Providers>
          <AnalyticsTracker />
          <StoreStatusChecker />
          {children}
          <ScrollToTop />
          <PWAInstallPrompt />
          <CartResumePopup />
        </Providers>
      </body>
    </html>
  );
}
