import api from './api'

export const inventoryService = {
  getAll: async () => {
    const res = await api.get('/inventory')
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/inventory/${id}`)
    return res.data
  },

  getLowStock: async () => {
    const res = await api.get('/inventory/low-stock')
    return res.data
  },

  create: async (data: object) => {
    const res = await api.post('/inventory', data)
    return res.data
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/inventory/${id}`, data)
    return res.data
  },

  log: async (id: string, data: { action: string; quantity: number; note: string }) => {
    const res = await api.post(`/inventory/${id}/log`, data)
    return res.data
  },
}
