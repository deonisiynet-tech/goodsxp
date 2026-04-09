import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductClient from './ProductClient';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/schema';

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

async function fetchProductBySlug(slug: string): Promise<{ product: Product | null; redirected?: boolean; newSlug?: string }> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';
  try {
    const res = await fetch(`${apiUrl}/api/products/${slug}`, {
      next: { revalidate: 60 },
      redirect: 'manual', // ✅ Не редіректити автоматично — обробимо вручну
    });

    // ✅ 301 редірект — старий slug → новий
    if (res.status === 301) {
      const data = await res.json();
      return { product: data.product, redirected: true, newSlug: data.newSlug };
    }

    if (!res.ok) return { product: null };
    const product = await res.json();
    return { product };
  } catch {
    return { product: null };
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { product, redirected, newSlug } = await fetchProductBySlug(params.slug);

  // ✅ Якщо редірект — генеруємо metadata для нового slug
  if (redirected && newSlug) {
    redirect(`/catalog/${newSlug}`);
  }

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
  const { product, redirected, newSlug } = await fetchProductBySlug(params.slug);

  // ✅ Серверний редірект на новий slug
  if (redirected && newSlug) {
    redirect(`/catalog/${newSlug}`);
  }

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

  // ✅ Server-side JSON-LD для Google (без виконання JS)
  const productJsonLd = generateProductJsonLd({
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description || '',
    price: product.price,
    originalPrice: product.originalPrice,
    discountPrice: product.discountPrice,
    imageUrl: product.imageUrl,
    images: Array.isArray(product.images) ? product.images : [],
    stock: product.stock,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    categoryId: (product as any).categoryId,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(`/catalog/${product.slug}`);

  return (
    <>
      {/* ✅ JSON-LD рендериться на сервері — Google бачить без JS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <ProductClient product={product} />
      <Footer />
    </>
  );
}
