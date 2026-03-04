'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createProduct, updateProduct, Product } from '@/actions/products'
import toast from 'react-hot-toast'
import { X, Upload } from 'lucide-react'

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Розмір файлу не повинен перевищувати 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border max-w-2xl w-full my-8 rounded-2xl max-h-[90vh] overflow-y-auto">
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

          <div>
            <label className="block text-sm font-medium mb-2">Зображення товару</label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {imagePreview || product?.imageUrl ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-surfaceLight border border-border">
                    <img
                      src={imagePreview || product!.imageUrl!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Видалити зображення
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={48} className="mx-auto text-muted mb-4" />
                  <p className="text-muted mb-2">Перетягніть зображення сюди або натисніть для вибору</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="btn-secondary inline-block cursor-pointer">
                      Обрати файл
                    </span>
                  </label>
                  <p className="text-xs text-muted mt-2">PNG, JPG до 5MB</p>
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
