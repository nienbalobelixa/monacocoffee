import api from './api'

export const posService = {
  getTablesWithOrders: async () => {
    const res = await api.get('/pos/tables')
    return res.data
  },

  getActiveOrders: async () => {
    const res = await api.get('/pos/active-orders')
    return res.data
  },

  createOrder: async (data: object) => {
    const res = await api.post('/pos/order', data)
    return res.data
  },

  processPayment: async (orderId: string, method: string) => {
    const res = await api.post(`/pos/payment/${orderId}`, { method })
    return res.data
  },
}
