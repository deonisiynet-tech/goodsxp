'use client'

import { useState } from 'react'
import { Product } from '@/actions/products'
import { useCartStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { X, ShoppingCart, ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface ProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  // Helper to normalize image path - ALWAYS returns path starting with /uploads/
  const normalizeImagePath = (img: string | null | undefined): string => {
    if (!img) return ''
    if (img.startsWith('/uploads/')) return img
    if (img.startsWith('/')) return `/uploads${img}`
    return `/uploads/${img}`
  }

  // Safe image list getter - NEVER returns undefined/null
  const getImageList = (): string[] => {
    // Safely get images array
    const images = Array.isArray(product.images) ? product.images : []
    
    // Normalize all image paths
    const normalizedImages = images.map(normalizeImagePath).filter(Boolean)
    
    // If no images, try imageUrl
    if (normalizedImages.length === 0 && product.imageUrl) {
      const normalizedUrl = normalizeImagePath(product.imageUrl)
      if (normalizedUrl) return [normalizedUrl]
    }
    
    return normalizedImages
  }

  const images = getImageList()

  // Safe selected image index
  const safeSelectedIndex = images.length > 0 
    ? Math.min(selectedImage, images.length - 1) 
    : 0

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background border border-border max-w-5xl w-full my-8 rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-2xl font-light">{product.title}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary" aria-label="Закрити">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-surfaceLight border border-border relative">
              {images.length > 0 ? (
                <>
                  <img 
                    key={safeSelectedIndex}
                    src={images[safeSelectedIndex]} 
                    alt={product.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800?text=No+Image'
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <span className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                        {safeSelectedIndex + 1} / {images.length}
                      </span>
                      <button 
                        onClick={() => handleImageClick('prev')} 
                        disabled={safeSelectedIndex === 0} 
                        className="absolute left-4 top-1/2 p-3 bg-black/60 text-white rounded-full disabled:opacity-30"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => handleImageClick('next')} 
                        disabled={safeSelectedIndex === images.length - 1} 
                        className="absolute right-4 top-1/2 p-3 bg-black/60 text-white rounded-full disabled:opacity-30"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
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
            {images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)} 
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      safeSelectedIndex === idx ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={'thumb ' + (idx + 1)} 
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
          <div className="flex flex-col">
            <p className="text-4xl font-light mb-6">
              {Number(product.price).toLocaleString('uk-UA')} UAH
            </p>
            <div className={`mb-6 ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <Check size={20} />
                  <span>В наявності: {product.stock} шт.</span>
                </div>
              ) : (
                'Немає в наявності'
              )}
            </div>
            <p className="text-muted leading-relaxed mb-8">{product.description}</p>
            <div className="space-y-4 mt-auto">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Кількість:</label>
                <div className="flex items-center border border-border">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-4 py-3 hover:bg-surfaceLight transition-colors"
                  >
                    -
                  </button>
                  <span className="w-16 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                    className="px-4 py-3 hover:bg-surfaceLight transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0} 
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? 'Додати до кошика' : 'Товар недоступний'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
