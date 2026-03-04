'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Order } from '@/actions/orders'

interface OrderModalProps {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, status: string) => void
}

export default function OrderModal({ order, onClose, onStatusChange }: OrderModalProps) {
  const [status, setStatus] = useState(order.status)
  const [loading, setLoading] = useState(false)

  const handleUpdateStatus = async () => {
    try {
      setLoading(true)
      await onStatusChange(order.id, status)
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = {
      NEW: 'Нове',
      PROCESSING: 'В обробці',
      SHIPPED: 'Відправлено',
      DELIVERED: 'Доставлено',
      CANCELLED: 'Скасовано',
    }
    return labels[s] || s
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background">
          <h2 className="text-2xl font-light">Замовлення #{order.id.slice(0, 8)}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Клієнт</h3>
              <div className="space-y-1 text-sm text-muted">
                <p>
                  <span className="text-secondary">Ім'я:</span> {order.name}
                </p>
                <p>
                  <span className="text-secondary">Телефон:</span> {order.phone}
                </p>
                <p>
                  <span className="text-secondary">Email:</span> {order.email}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Інформація</h3>
              <div className="space-y-1 text-sm text-muted">
                <p>
                  <span className="text-secondary">Дата:</span>{' '}
                  {new Date(order.createdAt).toLocaleString('uk-UA')}
                </p>
                <p>
                  <span className="text-secondary">Статус:</span> {getStatusLabel(order.status)}
                </p>
                <p>
                  <span className="text-secondary">Сума:</span>{' '}
                  {Number(order.totalPrice).toLocaleString('uk-UA')} ₴
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Адреса доставки</h3>
            <p className="text-muted">{order.address}</p>
            {order.comment && (
              <div className="mt-2">
                <p className="text-sm text-secondary">Коментар:</p>
                <p className="text-muted">{order.comment}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Товари</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-surfaceLight">
                  <div className="w-16 h-16 overflow-hidden bg-surfaceLight">
                    <img
                      src={item.product?.imageUrl || '/placeholder.jpg'}
                      alt={item.product?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.title}</p>
                    <p className="text-sm text-muted">
                      {item.quantity} шт. × {Number(item.price).toLocaleString('uk-UA')} ₴
                    </p>
                  </div>
                  <p className="font-medium">
                    {(Number(item.price) * item.quantity).toLocaleString('uk-UA')} ₴
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-2">Змінити статус</h3>
            <div className="flex gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field flex-1"
              >
                <option value="NEW">Нове</option>
                <option value="PROCESSING">В обробці</option>
                <option value="SHIPPED">Відправлено</option>
                <option value="DELIVERED">Доставлено</option>
                <option value="CANCELLED">Скасовано</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={loading || status === order.status}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
