import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductClient from './ProductClient';
import { generateBreadcrumbJsonLd, generateProductJsonLd } from '@/lib/schema';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

interface ProductSpecification {
  id: string;
  key: string;
  value: string;
}

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
  options?: any[];
  variants?: any[];
  specifications?: ProductSpecification[];
}

async function fetchProductBySlug(
  slug: string,
  isPreview: boolean = false
): Promise<{ product: Product | null; redirected?: boolean; newSlug?: string }> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';

  // Helper function to add timeout to fetch calls
  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`[Fetch Timeout] ${url} exceeded ${timeout}ms`);
        throw new Error('Request timeout');
      }
      throw error;
    }
  };

  // ✅ Створюємо безпечні теги - тільки базові, без динамічних значень
  const safeTags = ['products', 'catalog'].filter(Boolean);

  try {
    const res = await fetchWithTimeout(`${apiUrl}/api/products/${slug}`, {
      next: isPreview ? {
        revalidate: 0, // ✅ No cache for preview - always fresh data
        tags: safeTags
      } : {
        revalidate: 60, // ✅ 1 minute for normal view
        tags: safeTags
      },
      redirect: 'manual',
    }, 30000);

    if (res.status === 301) {
      const data = await res.json();
      return { product: data.product, redirected: true, newSlug: data.newSlug };
    }

    if (!res.ok) {
      console.warn(`[Product Fetch] Failed for ${slug}: ${res.status}`);
      return { product: null };
    }

    const product = (await res.json()) as Product;

    // Fetch variants and specifications in parallel with error handling
    const [variantsResult, specificationsResult] = await Promise.allSettled([
      fetchWithTimeout(`${apiUrl}/api/products/${product.id}/variants`, {
        next: isPreview ? {
          revalidate: 0, // ✅ No cache for preview
          tags: safeTags
        } : {
          revalidate: 60, // ✅ 1 minute for normal view
          tags: safeTags
        },
      }, 30000).catch(err => {
        console.warn(`[Variants Fetch] Failed for ${product.id}:`, err.message);
        return null;
      }),
      fetchWithTimeout(`${apiUrl}/api/products/${product.id}/specifications`, {
        next: isPreview ? {
          revalidate: 0, // ✅ No cache for preview
          tags: safeTags
        } : {
          revalidate: 60, // ✅ 1 minute for normal view
          tags: safeTags
        },
      }, 30000).catch(err => {
        console.warn(`[Specifications Fetch] Failed for ${product.id}:`, err.message);
        return null;
      }),
    ]);

    if (variantsResult.status === 'fulfilled' && variantsResult.value && variantsResult.value.ok) {
      const variantsData = await variantsResult.value.json();
      product.options = variantsData.options || [];
      product.variants = variantsData.variants || [];
    } else {
      product.options = [];
      product.variants = [];
    }

    if (specificationsResult.status === 'fulfilled' && specificationsResult.value && specificationsResult.value.ok) {
      const specificationsData = await specificationsResult.value.json();
      product.specifications = specificationsData.specifications || [];
    } else {
      product.specifications = [];
    }

    return { product };
  } catch (error: any) {
    console.error(`[Product Fetch] Error for ${slug}:`, error.message);
    return { product: null };
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}): Promise<Metadata> {
  const isPreview = searchParams?.preview === 'true';
  const { product, redirected, newSlug } = await fetchProductBySlug(params.slug, isPreview);

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
    ? imageUrl.startsWith('http')
      ? imageUrl
      : `${siteUrl}${imageUrl}`
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

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  const isPreview = searchParams?.preview === 'true';
  const { product, redirected, newSlug } = await fetchProductBySlug(params.slug, isPreview);

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
