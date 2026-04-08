import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductClient from './ProductClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  discountPrice: number | null;
  imageUrl: string | null;
  images: string[] | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  averageRating?: number;
  reviewCount?: number;
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';
  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Товар не знайдено | GoodsXP',
    };
  }

  const description = product.description
    ? product.description.slice(0, 160).replace(/<[^>]*>/g, '')
    : `Купити ${product.title} в GoodsXP — доставка Новою Поштою`;

  const imageUrl = product.images?.[0] || product.imageUrl;
  const ogImage = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`)
    : `${siteUrl}/og-image.jpg`;

  return {
    title: `${product.title} — GoodsXP`,
    description,
    alternates: {
      canonical: `${siteUrl}/catalog/${product.slug}`,
    },
    openGraph: {
      title: `${product.title} — GoodsXP`,
      description,
      url: `${siteUrl}/catalog/${product.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} — GoodsXP`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-[#9ca3af]">Товар не знайдено</p>
            <a href="/catalog" className="text-[#6366f1] hover:underline mt-4 inline-block">
              До каталогу
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <ProductClient product={product} />
      <Footer />
    </>
  );
}
