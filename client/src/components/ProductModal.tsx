'use client'

import { useState } from 'react'
import { Product } from '@/actions/products'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { X, ShoppingCart, ChevronLeft, ChevronRight, Check, Truck, Shield, RotateCcw } from 'lucide-react'

interface ProductWithSKU extends Product {
  sku?: string
}

interface ProductModalProps {
  product: ProductWithSKU
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  // Helper to get image URL - handles both Cloudinary and local paths
  const getImageUrl = (img: string | null | undefined): string => {
    if (!img) return ''
    // If it's already a full URL (Cloudinary), return as is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img
    }
    // If it's a local path starting with /, return as is
    if (img.startsWith('/')) {
      return img
    }
    // Otherwise prepend /
    return `/${img}`
  }

  // Safe image list getter
  const getImageList = (): string[] => {
    const images = Array.isArray(product.images) ? product.images : []
    const normalizedImages = images.map(getImageUrl).filter(Boolean)
    if (normalizedImages.length === 0 && product.imageUrl) {
      const normalizedUrl = getImageUrl(product.imageUrl)
      if (normalizedUrl) return [normalizedUrl]
    }
    return normalizedImages
  }

  const images = getImageList()
  const safeSelectedIndex = images.length > 0 ? Math.min(selectedImage, images.length - 1) : 0

  if (!isOpen) return null

  const handleAddToCart = () => {
    const imageUrl = images.length > 0 ? images[0] : undefined
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl,
      quantity
    })
    toast.success('Товар додано до кошика')
    onClose()
  }

  const handleImageClick = (dir: 'prev' | 'next') => {
    setSelectedImage(prev => dir === 'prev' ? Math.max(0, prev - 1) : Math.min(images.length - 1, prev + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal with animation */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="modal-card">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-[#1f1f23] hover:bg-[#26262b] 
                     text-[#9ca3af] hover:text-white rounded-full transition-all duration-200"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Image Gallery */}
            <div className="bg-[#0f0f12] p-6 md:p-8">
              {/* Main Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#1f1f23] border border-[#26262b] relative group">
                {images.length > 0 ? (
                  <>
                    <img
                      key={safeSelectedIndex}
                      src={images[safeSelectedIndex]}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image'
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageClick('prev')}
                          disabled={safeSelectedIndex === 0}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 
                                   bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full
                                   hover:bg-[#1f1f23] transition-all duration-200
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={() => handleImageClick('next')}
                          disabled={safeSelectedIndex === images.length - 1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 
                                   bg-[#0f0f12]/80 backdrop-blur-sm text-white rounded-full
                                   hover:bg-[#1f1f23] transition-all duration-200
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute top-4 right-4 px-3 py-1.5 
                                    bg-[#0f0f12]/80 backdrop-blur-sm text-white text-sm rounded-full">
                        {safeSelectedIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src="https://via.placeholder.com/800?text=No+Image"
                    alt="No image"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        safeSelectedIndex === idx
                          ? 'border-[#6366f1] ring-2 ring-[#6366f1]/30 scale-105'
                          : 'border-[#26262b] hover:border-[#6366f1]/50'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
                {product.title}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-4xl font-light text-white">
                  {Number(product.price).toLocaleString('uk-UA')} ₴
                </p>
              </div>

              {/* Stock Status */}
              <div className={`mb-6 flex items-center gap-2 ${
                product.stock > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {product.stock > 0 ? (
                  <>
                    <Check size={20} strokeWidth={2} />
                    <span className="text-sm font-medium">В наявності: {product.stock} шт.</span>
                  </>
                ) : (
                  <>
                    <X size={20} strokeWidth={2} />
                    <span className="text-sm font-medium">Немає в наявності</span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-[#9ca3af] leading-relaxed">{product.description}</p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Truck size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Швидка доставка</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <Shield size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Гарантія 12 міс</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-[#1f1f23] rounded-xl">
                  <RotateCcw size={20} className="text-[#6366f1] mb-2" />
                  <span className="text-xs text-[#9ca3af]">Повернення 14 днів</span>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 mt-auto">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-[#9ca3af]">Кількість:</label>
                  <div className="flex items-center border border-[#26262b] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 bg-[#1f1f23] hover:bg-[#26262b] transition-colors"
                    >
                      −
                    </button>
                    <span className="w-16 text-center text-white font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-3 bg-[#1f1f23] hover:bg-[#26262b] transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  {product.stock > 0 ? 'Додати до кошика' : 'Товар недоступний'}
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-[#26262b] mt-8 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">SKU:</span>
                  <span className="text-white font-mono">{product.sku ? product.sku.slice(0, 8).toUpperCase() : product.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9ca3af]">Категорія:</span>
                  <span className="text-white">Електроніка</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
