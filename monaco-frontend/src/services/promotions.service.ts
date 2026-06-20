import api from './api'

export const promotionsService = {
  getAll: async () => {
    const res = await api.get('/promotions')
    return res.data
  },

  getActive: async () => {
    const res = await api.get('/promotions/active')
    return res.data
  },

  validate: async (code: string) => {
    const res = await api.post('/promotions/validate', { code })
    return res.data
  },

  create: async (data: object) => {
    const res = await api.post('/promotions', data)
    return res.data
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/promotions/${id}`, data)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/promotions/${id}`)
    return res.data
  },
}
