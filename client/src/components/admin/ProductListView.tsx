'use client';

import { Edit, Trash2, Eye } from 'lucide-react';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

interface ProductListViewProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductListView({ products, onEdit, onDelete }: ProductListViewProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-white">Фото</th>
              <th className="text-left p-4 text-sm font-semibold text-white">Назва</th>
              <th className="text-left p-4 text-sm font-semibold text-white">Ціна</th>
              <th className="text-left p-4 text-sm font-semibold text-white">Кількість</th>
              <th className="text-left p-4 text-sm font-semibold text-white">Статус</th>
              <th className="text-right p-4 text-sm font-semibold text-white">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-surfaceLight/50 transition-colors"
              >
                <td className="p-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-surfaceLight flex-shrink-0">
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
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-white font-medium max-w-md truncate" title={product.title}>
                    {product.title}
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-white font-semibold">
                    {product.price.toLocaleString('uk-UA')} ₴
                  </p>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock > 0
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {product.stock} шт.
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {product.isActive ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        const previewWindow = window.open(`/catalog/${product.slug}?preview=true`, 'productPreview');
                        if (previewWindow) {
                          previewWindow.focus();
                        }
                      }}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
