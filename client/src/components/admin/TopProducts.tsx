'use client';

import { Package, TrendingUp } from 'lucide-react';

interface TopProduct {
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
  } | null;
  _sum: {
    quantity: number | null;
  };
  _count: number;
}

interface TopProductsProps {
  products?: TopProduct[];
  loading?: boolean;
}

export default function TopProducts({ products = [], loading = false }: TopProductsProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary">Топ товарів</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-surfaceLight rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-surfaceLight rounded w-3/4 mb-2" />
                <div className="h-3 bg-surfaceLight rounded w-1/2" />
              </div>
              <div className="h-8 bg-surfaceLight rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="card p-12 text-center text-muted">
        <Package size={48} className="mx-auto mb-4 opacity-50" />
        <p>Немає даних про продажі товарів</p>
      </div>
    );
  }

  // Get total sales for percentage calculation
  const totalSales = products.reduce(
    (sum, p) => sum + (p._sum.quantity || 0),
    0
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">Топ товарів</h2>
          <p className="text-sm text-muted mt-1">Найпопулярніші за кількістю замовлень</p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp size={20} />
          <span className="text-sm font-medium">{products.length} товарів</span>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => {
          const salesCount = product._sum.quantity || 0;
          const percentage = totalSales > 0 ? (salesCount / totalSales) * 100 : 0;

          return (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-surfaceLight transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>

              {/* Product Image */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-surfaceLight overflow-hidden">
                {product.product?.imageUrl ? (
                  <img
                    src={product.product.imageUrl}
                    alt={product.product?.title || 'Product'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-muted" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-primary truncate">
                  {product.product?.title || 'Товар видалено'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted">{salesCount} продажів</span>
                  {product.product && (
                    <>
                      <span className="text-muted">•</span>
                      <span className="text-sm text-muted">
                        {product.product.price.toLocaleString('uk-UA')} ₴
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Sales Bar */}
              <div className="flex-shrink-0 w-24">
                <div className="h-2 bg-surfaceLight rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
