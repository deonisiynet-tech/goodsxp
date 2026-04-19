'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface ProductFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  availability: 'all' | 'in_stock' | 'out_of_stock';
  categoryId: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  categories: Array<{ id: string; name: string }>;
}

export default function ProductFiltersComponent({ filters, onChange, categories }: ProductFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync with external filter changes
  useEffect(() => {
    if (filters.search !== searchInput) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.availability !== 'all' ||
    filters.categoryId;

  const clearFilters = () => {
    setSearchInput('');
    onChange({
      search: '',
      status: 'all',
      availability: 'all',
      categoryId: '',
    });
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Фільтри</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Скинути
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Пошук по назві..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as any })}
          className="input-field text-sm"
        >
          <option value="all">Всі статуси</option>
          <option value="active">Активні</option>
          <option value="inactive">Неактивні</option>
        </select>

        {/* Availability */}
        <select
          value={filters.availability}
          onChange={(e) => onChange({ ...filters, availability: e.target.value as any })}
          className="input-field text-sm"
        >
          <option value="all">Вся наявність</option>
          <option value="in_stock">В наявності</option>
          <option value="out_of_stock">Немає в наявності</option>
        </select>

        {/* Category */}
        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          className="input-field text-sm"
        >
          <option value="">Всі категорії</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
