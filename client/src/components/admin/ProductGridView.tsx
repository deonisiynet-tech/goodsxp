'use client';

import { Edit, Trash2, Eye } from 'lucide-react';

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

export default function ProductGridView({ products, onEdit, onDelete }: ProductGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="card overflow-hidden group hover:shadow-lg transition-all duration-300"
        >
          <div className="relative h-56 overflow-hidden bg-surfaceLight">
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
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {!product.isActive && (
                <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                  Неактивний
                </span>
              )}
              {product.stock === 0 && product.isActive && (
                <span className="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                  Немає
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-white mb-2 truncate text-lg" title={product.title}>
              {product.title}
            </h3>
            <p className="text-sm text-muted mb-4 line-clamp-2 min-h-[40px]">
              {product.description}
            </p>

            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-bold text-white">
                {product.price.toLocaleString('uk-UA')} ₴
              </p>
              <span
                className={`text-sm font-medium ${
                  product.stock > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {product.stock} шт.
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  product.isActive
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {product.isActive ? 'Активний' : 'Неактивний'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/catalog/${product.slug}?preview=true`, '_blank')}
                  className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  title="Переглянути товар"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                  title="Редагувати"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Видалити"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
