import api from './api'

export const paymentsService = {
  create: async (orderId: string, method: string) => {
    const res = await api.post(`/payments/order/${orderId}`, { method })
    return res.data
  },

  confirm: async (id: string, transactionRef?: string) => {
    const res = await api.patch(`/payments/${id}/confirm`, { transactionRef })
    return res.data
  },

  getByOrder: async (orderId: string) => {
    const res = await api.get(`/payments/order/${orderId}`)
    return res.data
  },
}
