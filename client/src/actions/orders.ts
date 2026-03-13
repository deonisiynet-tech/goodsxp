// Server Actions are deprecated in this project
// All API calls should go through Express API endpoints

export interface Order {
  id: string
  userId: string | null
  name: string
  phone: string
  email: string
  address: string
  totalPrice: number
  status: string
  comment: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product: any
}

// Placeholder functions - should not be used
export async function getOrders(): Promise<Order[]> {
  throw new Error('Deprecated: Use fetch API instead')
}

export async function updateOrderStatus(_id: string, _status: string): Promise<Order> {
  throw new Error('Deprecated: Use fetch API instead')
}

export async function deleteOrder(_id: string): Promise<void> {
  throw new Error('Deprecated: Use fetch API instead')
}
