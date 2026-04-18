'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { ProductSpecification, productsApi, variantsApi } from '@/lib/products-api'
import toast from 'react-hot-toast'
import { X, Upload, Trash2, ChevronLeft, ChevronRight, Plus, Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  margin: number
  originalPrice: number | null
  discountPrice: number | null
  isFeatured: boolean
  isPopular: boolean
  imageUrl: string | null
  images: string[]
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  categoryId: string | null
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

const EMPTY_SPECIFICATION: ProductSpecification = {
  key: '',
  value: '',
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  // Existing images from database (Cloudinary URLs)
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || [])
  // New images being uploaded (Cloudinary URLs only - no File objects!)
  const [newImages, setNewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Variant state
  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState<Record<string, string>>({});
  const [showVariants, setShowVariants] = useState(false);
  const [newVariant, setNewVariant] = useState({ price: 0, stock: 0, image: '', selectedOptions: {} as Record<string, string> });
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [initialSpecifications, setInitialSpecifications] = useState<ProductSpecification[]>([]);
  const [loadingSpecifications, setLoadingSpecifications] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productsApi.getCategories();
        setCategories(response.categories || []);
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    };
    loadCategories();
  }, []);

  // Load variants when editing existing product
  useEffect(() => {
    if (product?.id) {
      loadVariants(product.id);
    } else {
      setVariantOptions([]);
      setVariants([]);
    }
  }, [product?.id]);

  const loadVariants = async (productId: string) => {
    try {
      const res = await variantsApi.getVariants(productId);
      setVariantOptions(res.options || []);
      setVariants(res.variants || []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadSpecifications = async () => {
      if (!product?.id) {
        setSpecifications([]);
        setInitialSpecifications([]);
        setLoadingSpecifications(false);
        return;
      }

      setLoadingSpecifications(true);
      setSpecifications([]);
      setInitialSpecifications([]);

      try {
        const response = await productsApi.getSpecifications(product.id);
        if (cancelled) return;

        const loadedSpecifications = response.specifications || [];
        setSpecifications(loadedSpecifications);
        setInitialSpecifications(loadedSpecifications);
      } catch (e: any) {
        if (!cancelled) {
          toast.error(e.message || 'Не вдалося завантажити характеристики');
          setSpecifications([]);
          setInitialSpecifications([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSpecifications(false);
        }
      }
    };

    loadSpecifications();

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const handleAddSpecification = () => {
    setSpecifications((prev) => [...prev, { ...EMPTY_SPECIFICATION }]);
  };

  const handleSpecificationChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setSpecifications((prev) =>
      prev.map((specification, specIndex) =>
        specIndex === index ? { ...specification, [field]: value } : specification
      )
    );
  };

  const handleRemoveSpecification = (index: number) => {
    setSpecifications((prev) => prev.filter((_, specIndex) => specIndex !== index));
  };

  const normalizeSpecifications = () => {
    const normalized = specifications
      .map((specification) => ({
        ...specification,
        key: specification.key.trim(),
        value: specification.value.trim(),
      }))
      .filter((specification) => specification.key || specification.value);

    const hasIncompleteSpecification = normalized.some(
      (specification) => !specification.key || !specification.value
    );

    if (hasIncompleteSpecification) {
      throw new Error('Заповніть назву та значення для кожної характеристики або видаліть порожній рядок');
    }

    return normalized;
  };

  const syncSpecifications = async (productId: string) => {
    const normalizedSpecifications = normalizeSpecifications();
    const currentIds = new Set(
      normalizedSpecifications
        .map((specification) => specification.id)
        .filter((specificationId): specificationId is string => Boolean(specificationId))
    );

    const removedIds = initialSpecifications
      .map((specification) => specification.id)
      .filter(
        (specificationId): specificationId is string =>
          Boolean(specificationId) && !currentIds.has(specificationId)
      );

    // ✅ FIX: Delete specifications with individual error handling
    if (removedIds.length > 0) {
      const deleteResults = await Promise.allSettled(
        removedIds.map((specificationId) => productsApi.deleteSpecification(specificationId))
      );

      const failedDeletes = deleteResults.filter((r) => r.status === 'rejected');
      if (failedDeletes.length > 0) {
        console.warn(`⚠️ Failed to delete ${failedDeletes.length} specifications`);
      }
    }

    // ✅ FIX: Save specifications with individual error handling
    const saveResults = await Promise.allSettled(
      normalizedSpecifications.map((specification) =>
        productsApi.saveSpecification(productId, specification)
      )
    );

    const savedSpecifications = saveResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failedSaves = saveResults.filter((r) => r.status === 'rejected');
    if (failedSaves.length > 0) {
      console.error(`❌ Failed to save ${failedSaves.length} specifications:`, failedSaves);
      throw new Error(`Не вдалося зберегти ${failedSaves.length} характеристик`);
    }

    setSpecifications(savedSpecifications);
    setInitialSpecifications(savedSpecifications);
  };

  const handleAddOption = async () => {
    if (!product?.id || !newOptionName.trim()) return;
    try {
      const option = await variantsApi.createOption(product.id, newOptionName.trim());
      setVariantOptions((prev) => [...prev, option]);
      setNewOptionName('');
      toast.success('Опцію додано');
    } catch (e: any) {
      toast.error(e.message || 'Помилка додавання опції');
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Видалити опцію та всі її значення?')) return;
    try {
      await variantsApi.deleteOption(optionId);
      setVariantOptions((prev) => prev.filter((o) => o.id !== optionId));
      toast.success('Опцію видалено');
    } catch (e: any) {
      toast.error(e.message || 'Помилка видалення');
    }
  };

  const handleAddOptionValue = async (optionId: string) => {
    const value = newOptionValue[optionId]?.trim();
    if (!value) return;
    try {
      const optionValue = await variantsApi.createOptionValue(optionId, value);
      setVariantOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, values: [...(o.values || []), optionValue] } : o
        )
      );
      setNewOptionValue((prev) => ({ ...prev, [optionId]: '' }));
      toast.success('Значення додано');
    } catch (e: any) {
      toast.error(e.message || 'Помилка');
    }
  };

  const handleDeleteOptionValue = async (optionId: string, valueId: string) => {
    try {
      await variantsApi.deleteOptionValue(valueId);
      setVariantOptions((prev) =>
        prev.map((o) =>
          o.id === optionId
            ? { ...o, values: (o.values || []).filter((v: any) => v.id !== valueId) }
            : o
        )
      );
      toast.success('Значення видалено');
    } catch (e: any) {
      toast.error(e.message || 'Помилка');
    }
  };

  const handleCreateVariant = async () => {
    if (!product?.id) return;
    const selectedOptionIds = Object.entries(newVariant.selectedOptions);
    if (selectedOptionIds.length === 0) {
      toast.error('Оберіть хоча б одну характеристику');
      return;
    }

    // ✅ Перевірка дублікатів — чи вже існує така комбінація
    const newValueIds = selectedOptionIds.map(([, vid]) => vid).sort().join(',');
    const existingDuplicate = variants.find((v) => {
      const existingIds = (v.options || []).map((o: any) => o.optionValueId).sort().join(',');
      return existingIds === newValueIds;
    });
    if (existingDuplicate) {
      toast.error('Такий варіант вже існує');
      return;
    }

    const options = selectedOptionIds.map(([optionId, optionValueId]) => {
      const option = variantOptions.find((o) => o.id === optionId);
      const value = option?.values?.find((v: any) => v.id === optionValueId);
      return { optionId, optionValueId, name: option?.name || '', value: value?.value || '' };
    });

    try {
      const variant = await variantsApi.createVariant(product.id, {
        price: newVariant.price,
        stock: newVariant.stock,
        image: newVariant.image || null,
        options,
      });
      setVariants((prev) => [...prev, variant]);
      setNewVariant({ price: 0, stock: 0, image: '', selectedOptions: {} });
      toast.success('Варіант створено');
    } catch (e: any) {
      toast.error(e.message || 'Помилка створення варіанту');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Видалити варіант?')) return;
    try {
      await variantsApi.deleteVariant(variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast.success('Варіант видалено');
    } catch (e: any) {
      toast.error(e.message || 'Помилка');
    }
  };

  // All images for display = existing URLs + new URLs
  const allImages = [
    ...existingImages,
    ...newImages
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price || 0,
      margin: product?.margin ?? 0,
      originalPrice: product?.originalPrice || 0,
      discountPrice: product?.discountPrice || 0,
      stock: product?.stock || 0,
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isPopular: product?.isPopular ?? false,
      categoryId: product?.categoryId || '',
    },
  })

  // Reset form when product changes (e.g., when opening modal for edit)
  useEffect(() => {
    reset({
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price || 0,
      margin: product?.margin ?? 0,
      originalPrice: product?.originalPrice || 0,
      discountPrice: product?.discountPrice || 0,
      stock: product?.stock || 0,
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      isPopular: product?.isPopular ?? false,
      categoryId: product?.categoryId || '',
    })
    setExistingImages(product?.images || [])
    setNewImages([])
  }, [product, reset])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)

      // Combine existing image URLs with newly uploaded ones
      const allImageUrls = [
        ...existingImages,
        ...newImages
      ]

      console.log('💾 Submitting product:', {
        title: data.title,
        price: data.price,
        margin: data.margin,
        stock: data.stock,
        isActive: data.isActive,
        imagesCount: allImageUrls.length,
        images: allImageUrls,
      })

      let savedProductId = product?.id || ''

      if (product) {
        // Update existing product
        const result = await productsApi.update(product.id, {
          title: data.title,
          description: data.description,
          price: data.price,
          margin: data.margin,
          originalPrice: data.originalPrice || null,
          discountPrice: data.discountPrice || null,
          stock: data.stock,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isPopular: data.isPopular,
          categoryId: data.categoryId || null,
          images: allImageUrls,
        })
        savedProductId = result.id
        toast.success('Товар оновлено')
      } else {
        // Create new product
        const result = await productsApi.create({
          title: data.title,
          description: data.description,
          price: data.price,
          margin: data.margin,
          originalPrice: data.originalPrice || null,
          discountPrice: data.discountPrice || null,
          stock: data.stock,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isPopular: data.isPopular,
          categoryId: data.categoryId || null,
          images: allImageUrls,
        })
        savedProductId = result.id
        console.log('📦 Create result:', result)
        toast.success('Товар створено')
      }

      // ✅ FIX: Separate specifications sync with detailed error handling
      try {
        await syncSpecifications(savedProductId)
        console.log('✅ Specifications synced successfully')
      } catch (specError: any) {
        console.error('❌ Specifications sync error:', specError)
        toast.error('Товар збережено, але помилка при збереженні характеристик: ' + specError.message)
        // Don't throw - product is already saved
      }

      onClose()
    } catch (error: any) {
      console.error('❌ Submission error:', error)
      // ✅ FIX: More detailed error messages
      if (error.message.includes('margin')) {
        toast.error('Помилка збереження маржі: ' + error.message)
      } else if (error.message.includes('price')) {
        toast.error('Помилка збереження ціни: ' + error.message)
      } else if (error.message.includes('title')) {
        toast.error('Помилка: назва товару обов\'язкова')
      } else {
        toast.error('Помилка збереження товару: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadingImages(true)

      console.log(`📁 Selected ${files.length} file(s)`)

      // Create FormData with ALL files at once
      const formData = new FormData()
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Файл "${file.name}" занадто великий (макс. 10MB)`)
          continue
        }
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`Файл "${file.name}" не є зображенням`)
          continue
        }
        // Append each file with the same field name 'files'
        formData.append('files', file)
        console.log(`⬆️ Added to FormData: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      }

      try {
        console.log('📤 Sending upload request...')
        console.log('📋 FormData entries:')
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: ${value.name} (${value.size} bytes)`)
          }
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          // IMPORTANT: Don't set Content-Type header!
          // Browser will set it automatically with boundary
        })

        console.log('📥 Upload response status:', response.status)
        const result = await response.json()
        console.log('📥 Upload result:', result)

        if (!response.ok) {
          throw new Error(result.error || result.message || 'Помилка завантаження')
        }

        if (result.success && result.urls && result.urls.length > 0) {
          // Add all uploaded URLs to state
          setNewImages((prev) => [...prev, ...result.urls])
          toast.success(`✅ Завантажено ${result.urls.length} зображень`)
        } else {
          throw new Error(result.error || 'Помилка завантаження')
        }
      } catch (error: any) {
        console.error('❌ Upload error:', error)
        toast.error(`Помилка: ${error.message}`)
      } finally {
        // Reset input value
        e.target.value = ''
        setUploadingImages(false)
      }
    }
  }

  const removeImage = (index: number) => {
    // Check if removing from existing or new images
    if (index < existingImages.length) {
      // Removing from existing images
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
    } else {
      // Removing from new images
      const newIndex = index - existingImages.length
      setNewImages((prev) => prev.filter((_, i) => i !== newIndex))
    }
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= allImages.length) return

    // Need to handle existing and new images separately
    if (index < existingImages.length) {
      // Moving within existing images
      if (newIndex < existingImages.length) {
        const newExisting = [...existingImages]
        ;[newExisting[index], newExisting[newIndex]] = [newExisting[newIndex], newExisting[index]]
        setExistingImages(newExisting)
      }
    } else {
      // Moving within new images
      const newImgIndex = index - existingImages.length
      const newNewIndex = newIndex - existingImages.length
      if (newNewIndex >= 0 && newNewIndex < newImages.length) {
        const newNewImages = [...newImages]
        ;[newNewImages[newImgIndex], newNewImages[newNewIndex]] = [newNewImages[newNewIndex], newNewImages[newImgIndex]]
        setNewImages(newNewImages)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border max-w-4xl w-full my-8 rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-2xl font-light">
            {product ? 'Редагувати товар' : 'Новий товар'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва *</label>
            <input
              {...register('title', { required: 'Назва обов\'язкова' })}
              className="input-field"
              placeholder="Наприклад: iPhone 15 Pro"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">{errors.title.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Опис *</label>
            <textarea
              {...register('description', { required: 'Опис обов\'язковий' })}
              className="input-field"
              rows={4}
              placeholder="Детальний опис товару"
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description.message as string}</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">💰 Ціноутворення</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ціна продажу *</label>
                <input
                  {...register('price', {
                    required: 'Ціна обов\'язкова',
                    min: { value: 0, message: 'Ціна має бути додатною' },
                    valueAsNumber: true, // ✅ FIX: Convert string to number
                  })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="1000"
                />
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1">{errors.price.message as string}</p>
                )}
                <p className="text-xs text-muted mt-1">Основна ціна товару</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <span className="text-purple-400">Оригінальна ціна</span>
                </label>
                <input
                  {...register('originalPrice', {
                    min: { value: 0, message: 'Ціна має бути додатною' },
                    valueAsNumber: true, // ✅ FIX: Convert string to number
                  })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="1500"
                />
                <p className="text-xs text-muted mt-1">Зачеркнута ціна (для знижки)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <span className="text-pink-400">Ціна зі знижкою</span>
                </label>
                <input
                  {...register('discountPrice', {
                    min: { value: 0, message: 'Ціна має бути додатною' },
                    valueAsNumber: true, // ✅ FIX: Convert string to number
                  })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="1200"
                />
                <p className="text-xs text-muted mt-1">Якщо менше ціни продажу — застосовується знижка</p>
              </div>
            </div>
          </div>

          {/* Margin Block — окремий блок, не змішаний з цінами */}
          <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
            <h3 className="text-sm font-semibold text-green-400 mb-3">📊 Прибуток (маржа)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Маржа з 1 одиниці (₴)</label>
                <input
                  {...register('margin', {
                    required: 'Маржа обов\'язкова',
                    min: { value: 0, message: 'Маржа не може бути менше 0' },
                    valueAsNumber: true, // ✅ FIX: Convert string to number
                  })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="0"
                />
                {errors.margin && (
                  <p className="text-red-400 text-sm mt-1">{errors.margin.message as string}</p>
                )}
                <p className="text-xs text-muted mt-1">Чистий прибуток з однієї одиниці товару</p>
              </div>
              <div className="flex items-end">
                <div className="text-xs text-muted space-y-1">
                  <p>💡 <strong>Оборот</strong> = ціна продажу × кількість</p>
                  <p>💡 <strong>Прибуток</strong> = маржа × кількість</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-500/50 cursor-pointer transition-colors bg-surface/50">
              <input
                type="checkbox"
                {...register('isFeatured')}
                className="w-5 h-5 rounded accent-purple-500"
              />
              <div>
                <span className="font-medium text-white">🔥 Хіт-продаж</span>
                <p className="text-xs text-muted">Показувати бейдж на товарі</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-500/50 cursor-pointer transition-colors bg-surface/50">
              <input
                type="checkbox"
                {...register('isPopular')}
                className="w-5 h-5 rounded accent-purple-500"
              />
              <div>
                <span className="font-medium text-white">⭐ Популярний товар</span>
                <p className="text-xs text-muted">Показувати бейдж на товарі</p>
              </div>
            </label>
          </div>

          {/* ✅ Category selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Категорія</label>
            <select
              {...register('categoryId')}
              className="input-field"
            >
              <option value="">Без категорії</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Залишок (шт.) *</label>
            <input
              {...register('stock', {
                required: 'Залишок обов\'язковий',
                min: { value: 0, message: 'Некоректне значення' },
                valueAsNumber: true, // ✅ FIX: Convert string to number
              })}
              type="number"
              className="input-field"
            />
            {errors.stock && (
              <p className="text-red-400 text-sm mt-1">{errors.stock.message as string}</p>
            )}
          </div>

          {/* Image Gallery */}
          <div>
            <label className="block text-sm font-medium mb-2">Зображення товару</label>
            <div className="border-2 border-dashed border-border rounded-xl p-6">
              {/* Hidden file input - always rendered */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />

              {allImages.length > 0 ? (
                <div>
                  <p className="text-sm text-muted mb-4">
                    Перший елемент буде основним зображенням. Перетягуйте для зміни порядку.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allImages.map((img, index) => {
                      const isNew = index >= existingImages.length
                      const isUploading = uploadingImages && isNew

                      return (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-surfaceLight border border-border">
                          <img
                            src={img}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=No+Image'
                            }}
                          />

                          {/* Uploading indicator */}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}

                          {/* Overlay controls */}
                          {!isUploading && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'left')}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                  title="Вліво"
                                >
                                  <ChevronLeft size={16} className="text-white" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                                title="Видалити"
                              >
                                <Trash2 size={16} className="text-white" />
                              </button>
                              {index < allImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'right')}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                  title="Вправо"
                                >
                                  <ChevronRight size={16} className="text-white" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Main image badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-background text-xs font-medium rounded">
                              Основне
                            </div>
                          )}

                          {/* Cloudinary badge */}
                          {isNew && !isUploading && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                              Cloudinary
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Add more images button - always visible when gallery has images */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary inline-flex items-center gap-2 w-full justify-center py-4"
                    >
                      <Upload size={18} />
                      Додати ще зображень
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-muted mb-2">Перетягніть зображення сюди або натисніть для вибору</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary inline-block cursor-pointer"
                  >
                    Обрати файли
                  </button>
                  <p className="text-xs text-muted mt-2">PNG, JPG до 5MB (можна декілька)</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Характеристики</h3>
                <p className="mt-1 text-sm text-muted">
                  Додавайте довільні пари ключ/значення будь-якою мовою: колір, гарантія, вага, матеріал тощо.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSpecification}
                className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm"
              >
                <Plus size={16} />
                Додати
              </button>
            </div>

            {loadingSpecifications ? (
              <div className="rounded-lg border border-border bg-[#1f1f23] px-4 py-5 text-sm text-muted">
                Завантаження характеристик...
              </div>
            ) : specifications.length > 0 ? (
              <div className="space-y-3">
                {specifications.map((specification, index) => (
                  <div
                    key={specification.id || `specification-${index}`}
                    className="grid gap-3 rounded-lg border border-border bg-[#1f1f23] p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <input
                      value={specification.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      placeholder="Наприклад: Колір"
                      className="input-field text-sm"
                    />
                    <input
                      value={specification.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      placeholder="Наприклад: Чорний"
                      className="input-field text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecification(index)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/20"
                      title="Видалити характеристику"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                Поки що немає характеристик. Натисніть «Додати», щоб створити перший рядок.
              </div>
            )}
          </div>

          {/* ===== VARIANT MANAGEMENT ===== */}
          {product?.id && (
            <div className="border border-border rounded-xl p-4 bg-surface/50">
              <button
                type="button"
                onClick={() => setShowVariants(!showVariants)}
                className="flex items-center gap-2 text-sm font-semibold text-white w-full"
              >
                <Package size={18} className="text-purple-400" />
                Варіанти товару
                <span className="ml-auto text-muted text-xs">
                  {variants.length} шт.
                </span>
              </button>

              {showVariants && (
                <div className="mt-4 space-y-4">
                  {/* Add Option */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Додати характеристику</label>
                    <div className="flex gap-2">
                      <input
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        placeholder="Наприклад: Колір"
                        className="input-field text-sm py-2"
                      />
                      <button type="button" onClick={handleAddOption} className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Option Values */}
                    {variantOptions.map((option) => (
                      <div key={option.id} className="mt-2 p-2 bg-[#1f1f23] rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{option.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(option.values || []).map((v: any) => (
                            <span
                              key={v.id}
                              className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              {v.value}
                              <button
                                type="button"
                                onClick={() => handleDeleteOptionValue(option.id, v.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <input
                            value={newOptionValue[option.id] || ''}
                            onChange={(e) => setNewOptionValue((prev) => ({ ...prev, [option.id]: e.target.value }))}
                            placeholder="Додати значення..."
                            className="input-field text-xs py-1.5 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionValue(option.id)}
                            className="text-purple-400 hover:text-purple-300 text-xs px-2"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Variant */}
                  {variantOptions.length > 0 && (
                    <div className="p-3 bg-[#1f1f23] rounded-lg">
                      <label className="block text-xs font-medium text-white mb-2">Створити варіант</label>
                      {/* Option selectors */}
                      {variantOptions.map((option) => (
                        <div key={option.id} className="mb-2">
                          <label className="block text-xs text-muted mb-0.5">{option.name}</label>
                          <select
                            value={newVariant.selectedOptions[option.id] || ''}
                            onChange={(e) =>
                              setNewVariant((prev) => ({
                                ...prev,
                                selectedOptions: { ...prev.selectedOptions, [option.id]: e.target.value },
                              }))
                            }
                            className="input-field text-xs py-1.5"
                          >
                            <option value="">— Оберіть —</option>
                            {(option.values || []).map((v: any) => (
                              <option key={v.id} value={v.id}>{v.value}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-xs text-muted mb-0.5">Ціна</label>
                          <input
                            type="number"
                            value={newVariant.price || ''}
                            onChange={(e) => setNewVariant((prev) => ({ ...prev, price: Number(e.target.value) }))}
                            className="input-field text-xs py-1.5"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-0.5">Залишок</label>
                          <input
                            type="number"
                            value={newVariant.stock || ''}
                            onChange={(e) => setNewVariant((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                            className="input-field text-xs py-1.5"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateVariant}
                        className="btn-primary w-full mt-2 py-2 text-xs"
                      >
                        Створити варіант
                      </button>
                    </div>
                  )}

                  {/* Existing Variants */}
                  {variants.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-white mb-2">
                        Існуючі варіанти ({variants.length})
                      </label>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {variants.map((v) => (
                          <div key={v.id} className="flex items-center justify-between p-2 bg-[#1f1f23] rounded-lg text-xs">
                            <div className="flex-1">
                              <span className="text-white">
                                {(v.options || []).map((o: any) => o.value).join(' / ')}
                              </span>
                              <span className="text-muted ml-2">
                                — {Number(v.price).toLocaleString('uk-UA')} ₴ / {v.stock} шт.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.id)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded border-border bg-surfaceLight text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Активний (відображається на сайті)
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
