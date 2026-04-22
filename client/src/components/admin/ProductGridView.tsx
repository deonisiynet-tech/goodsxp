'use client';

import { Edit, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

interface ProductGridViewProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

function ProductGridView({ products, onEdit, onDelete }: ProductGridViewProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="card overflow-hidden group hover:shadow-lg transition-all duration-300"
        >
          <div className="relative h-48 sm:h-56 overflow-hidden bg-surfaceLight">
            <img
              src={
                product.imageUrl
                  ? product.imageUrl.startsWith('http')
                    ? product.imageUrl
                    : product.imageUrl.startsWith('/')
                      ? product.imageUrl
                      : `/uploads/${product.imageUrl}`
                  : '/placeholder.jpg'
              }
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2">
              {!product.isActive && (
                <span className="px-2 sm:px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                  Неактивний
                </span>
              )}
              {product.stock === 0 && product.isActive && (
                <span className="px-2 sm:px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                  Немає
                </span>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <h3 className="font-semibold text-white mb-2 line-clamp-2 text-base sm:text-lg" title={product.title}>
              {product.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted mb-3 sm:mb-4 line-clamp-2 min-h-[32px] sm:min-h-[40px]">
              {product.description}
            </p>

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xl sm:text-2xl font-bold text-white">
                {product.price.toLocaleString('uk-UA')} ₴
              </p>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  product.stock > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {product.stock} шт.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border">
              <span
                className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium ${
                  product.isActive
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {product.isActive ? 'Активний' : 'Неактивний'}
              </span>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/catalog/${product.slug}?preview=true`)}
                  className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Переглянути товар"
                >
                  <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Редагувати"
                >
                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Видалити"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(ProductGridView);
