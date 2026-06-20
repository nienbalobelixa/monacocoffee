import api from './api'

export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  isFeatured?: boolean
  isAvailable?: boolean
}

export const productsService = {
  getAll: async (params?: ProductQuery) => {
    const res = await api.get('/products', { params })
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/products/${id}`)
    return res.data
  },

  getBySlug: async (slug: string) => {
    const res = await api.get(`/products/slug/${slug}`)
    return res.data
  },

  getFeatured: async () => {
    const res = await api.get('/products/featured')
    return res.data
  },

  create: async (data: FormData | object) => {
    const res = await api.post('/products', data)
    return res.data
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/products/${id}`, data)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/products/${id}`)
    return res.data
  },
}
