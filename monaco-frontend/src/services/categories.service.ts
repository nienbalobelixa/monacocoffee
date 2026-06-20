import api from './api'

export const categoriesService = {
  getAll: async () => {
    const res = await api.get('/categories')
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/categories/${id}`)
    return res.data
  },

  create: async (data: object) => {
    const res = await api.post('/categories', data)
    return res.data
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/categories/${id}`, data)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`)
    return res.data
  },
}
