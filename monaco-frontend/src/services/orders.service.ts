import api from './api'

export interface CreateOrderData {
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE'
  tableId?: string
  promotionCode?: string
  note?: string
  deliveryAddress?: string
  items: Array<{ productId: string; quantity: number; note?: string }>
}

export const ordersService = {
  create: async (data: CreateOrderData) => {
    const res = await api.post('/orders', data)
    return res.data
  },

  getAll: async (params?: object) => {
    const res = await api.get('/orders', { params })
    return res.data
  },

  getMyOrders: async (params?: object) => {
    const res = await api.get('/orders/my', { params })
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/orders/${id}`)
    return res.data
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/orders/${id}/status`, { status })
    return res.data
  },

  update: async (id: string, data: any) => {
    const res = await api.patch(`/orders/${id}`, data)
    return res.data
  },

  cancel: async (id: string) => {
    const res = await api.delete(`/orders/${id}`)
    return res.data
  },
}
