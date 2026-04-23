'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/products-api';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import ProductModal from './ProductModal';
import ViewToggle, { ViewMode } from './ViewToggle';
import ProductFiltersComponent, { ProductFilters } from './ProductFilters';
import ProductGridView from './ProductGridView';
import ProductListView from './ProductListView';
import Pagination from './Pagination';

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  margin: number;
  originalPrice: number | null;
  discountPrice: number | null;
  discountPercent?: number | null;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  images: string[];
  isFeatured: boolean;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 20;

export default function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-products-view');
      return (saved as ViewMode) || 'grid';
    }
    return 'grid';
  });

  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    status: 'all',
    availability: 'all',
    categoryId: '',
  });

  useEffect(() => {
    loadProducts();
  }, [filters.search, currentPage]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await productsApi.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAllAdmin({
        search: filters.search,
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      setProducts(response.products || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalProducts(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  // Handle view mode change with localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-products-view', mode);
    }
  };

  // Handle filters change and reset to page 1
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter products based on filters
  const filteredProducts = products.filter((product) => {
    // Status filter
    if (filters.status === 'active' && !product.isActive) return false;
    if (filters.status === 'inactive' && product.isActive) return false;

    // Availability filter
    if (filters.availability === 'in_stock' && product.stock === 0) return false;
    if (filters.availability === 'out_of_stock' && product.stock > 0) return false;

    // Category filter
    if (filters.categoryId && product.categoryId !== filters.categoryId) return false;

    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return;

    try {
      // ✅ OPTIMISTIC UPDATE: Remove from UI immediately
      setProducts(prev => prev.filter(p => p.id !== id));

      await productsApi.delete(id);
      toast.success('✅ Товар видалено');

      // Refresh to get accurate data
      loadProducts();
    } catch (error) {
      toast.error('Помилка при видаленні');
      // Reload on error to restore correct state
      loadProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    // ✅ INSTANT REFRESH: Reload products immediately after modal closes
    loadProducts();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-light">Керування товарами</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
          <button onClick={handleCreate} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial py-3 sm:py-2">
            <Plus size={20} />
            <span className="hidden sm:inline">Додати товар</span>
            <span className="sm:hidden">Додати</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <ProductFiltersComponent
          filters={filters}
          onChange={handleFiltersChange}
          categories={categories}
        />
      </div>

      {!loading && filteredProducts.length > 0 && (
        <div className="mb-4 text-xs sm:text-sm text-muted">
          Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)} з {totalProducts} товарів
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-surfaceLight" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surfaceLight rounded w-3/4" />
                <div className="h-4 bg-surfaceLight rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-20 text-muted px-4">
          <p className="text-base sm:text-lg mb-2">Товари не знайдені</p>
          <p className="text-xs sm:text-sm">Спробуйте змінити фільтри або додати новий товар</p>
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGridView
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <ProductListView
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProducts}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      )}

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
