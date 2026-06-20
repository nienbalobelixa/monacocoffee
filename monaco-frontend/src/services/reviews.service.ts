import api from './api'

export const reviewsService = {
  getByProduct: async (productId: string) => {
    const res = await api.get(`/reviews/product/${productId}`)
    return res.data
  },

  create: async (data: { productId: string; rating: number; comment?: string }) => {
    const res = await api.post('/reviews', data)
    return res.data
  },
}
