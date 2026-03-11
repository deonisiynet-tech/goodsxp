'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { createProduct, updateProduct, Product } from '@/actions/products'
import toast from 'react-hot-toast'
import { X, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  // Combine existing images with any new previews
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || [])
  const [newImages, setNewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // All images = existing + new (for display purposes)
  const allImages = [...existingImages, ...newImages]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: product
      ? {
          title: product.title,
          description: product.description,
          price: product.price,
          stock: product.stock,
          isActive: product.isActive,
        }
      : {
          isActive: true,
        },
  })

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('price', data.price.toString())
      formData.append('stock', data.stock.toString())
      formData.append('isActive', data.isActive ? 'on' : 'off')

      // Save all images (existing + new) as JSON string
      formData.append('images', JSON.stringify(allImages))

      if (product) {
        const result = await updateProduct(product.id, formData)
        if (result.success) {
          toast.success('Товар оновлено')
        } else {
          toast.error(result.error || 'Помилка при оновленні')
        }
      } else {
        const result = await createProduct(formData)
        if (result.success) {
          toast.success('Товар створено')
        } else {
          toast.error(result.error || 'Помилка при створенні')
        }
      }

      onClose()
    } catch (error: any) {
      toast.error('Помилка при збереженні')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Файл "${file.name}" занадто великий (макс. 5MB)`)
          return
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`Файл "${file.name}" не є зображенням`)
          return
        }

        // Create preview URL for new image
        const previewUrl = URL.createObjectURL(file)
        setNewImages((prev) => [...prev, previewUrl])
      })
      
      // Reset input value to allow selecting the same file again
      e.target.value = ''
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

    // Swap images in the combined array
    const newAllImages = [...allImages]
    ;[newAllImages[index], newAllImages[newIndex]] = [newAllImages[newIndex], newAllImages[index]]
    
    // Split back into existing and new
    setExistingImages(newAllImages.slice(0, existingImages.length))
    setNewImages(newAllImages.slice(existingImages.length))
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ціна (₴) *</label>
              <input
                {...register('price', {
                  required: 'Ціна обов\'язкова',
                  min: { value: 0, message: 'Ціна має бути додатною' },
                })}
                type="number"
                step="0.01"
                className="input-field"
              />
              {errors.price && (
                <p className="text-red-400 text-sm mt-1">{errors.price.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Залишок (шт.) *</label>
              <input
                {...register('stock', {
                  required: 'Залишок обов\'язковий',
                  min: { value: 0, message: 'Некоректне значення' },
                })}
                type="number"
                className="input-field"
              />
              {errors.stock && (
                <p className="text-red-400 text-sm mt-1">{errors.stock.message as string}</p>
              )}
            </div>
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
                      return (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-surfaceLight border border-border">
                          <img
                            src={img}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Overlay controls */}
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

                          {/* Main image badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-background text-xs font-medium rounded">
                              Основне
                            </div>
                          )}

                          {/* New image badge */}
                          {isNew && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                              Нове
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
              Скасуати
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
