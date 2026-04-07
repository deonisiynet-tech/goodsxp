const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * Генерує BreadcrumbList з маршруту сторінки
 * Використовується для SEO Rich Results — Google показує хлібні крихти в пошуку
 */
export function generateBreadcrumbFromPath(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === '/') {
    return [{ name: 'Головна', item: siteUrl }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Головна', item: siteUrl }];

  let accumulatedPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    // Skip admin, login, register, and other non-content routes
    if (['admin', 'admin-x8k2p9-panel', 'login', 'register', 'cart', 'checkout', 'orders', 'wishlist'].includes(segment)) {
      continue;
    }

    accumulatedPath += `/${segment}`;
    const url = `${siteUrl}${accumulatedPath}`;

    // Map segment to display name
    const nameMap: Record<string, string> = {
      catalog: 'Каталог',
      delivery: 'Доставка',
      payment: 'Оплата',
      warranty: 'Гарантія',
      contacts: 'Контакти',
      about: 'Про нас',
      privacy: 'Політика конфіденційності',
      terms: 'Умови використання',
    };

    breadcrumbs.push({
      name: nameMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      item: url,
    });
  }

  return breadcrumbs;
}

/**
 * Генерує JSON-LD для BreadcrumbList
 */
export function generateBreadcrumbJsonLd(pathname: string) {
  const breadcrumbs = generateBreadcrumbFromPath(pathname);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

/**
 * Генерує JSON-LD для Product
 */
export function generateProductJsonLd(product: {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPrice: number | null;
  imageUrl: string | null;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  categoryId?: string | null;
  categoryName?: string;
}) {
  const images = [
    ...(product.images.length > 0 ? product.images : []),
    ...(product.imageUrl ? [product.imageUrl] : []),
  ].map((img: string) => {
    if (img.startsWith('http')) return img;
    return `${siteUrl}${img.startsWith('/') ? img : `/${img}`}`;
  });

  const productPrice = product.discountPrice && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

  const productUrl = `${siteUrl}/catalog/${product.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || '',
    image: images.length > 0 ? images : undefined,
    sku: product.id,
    brand: {
      '@type': 'Organization',
      name: 'GoodsXP',
    },
    url: productUrl,
    offers: {
      '@type': 'Offer',
      price: Number(productPrice).toFixed(2),
      priceCurrency: 'UAH',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: 'GoodsXP',
      },
    },
    ...(product.averageRating && product.reviewCount && product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/**
 * Генерує JSON-LD для Organization (повний)
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GoodsXP',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Інтернет-магазин сучасної електроніки та гаджетів',
    telephone: '+380634010552',
    email: 'support@goodsxp.store',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+380634010552',
      email: 'support@goodsxp.store',
      contactType: 'customer service',
      availableLanguage: ['Ukrainian'],
      areaServed: 'UA',
    },
    sameAs: [
      'https://t.me/goodsxp',
    ],
  };
}

/**
 * Генерує JSON-LD для WebSite з SearchAction
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GoodsXP',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/catalog?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Генерує JSON-LD для ItemList (каталог товарів)
 */
export function generateItemListJsonLd(products: any[], page: number = 1) {
  if (!products || products.length === 0) {
    return { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [] };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1 + (page - 1) * 12, // account for pagination
      item: {
        '@type': 'Product',
        name: product.title,
        url: `${siteUrl}/catalog/${product.slug}`,
        image: product.imageUrl || undefined,
        offers: {
          '@type': 'Offer',
          price: product.discountPrice && product.discountPrice < product.price
            ? product.discountPrice
            : product.price,
          priceCurrency: 'UAH',
        },
      },
    })),
  };
}
