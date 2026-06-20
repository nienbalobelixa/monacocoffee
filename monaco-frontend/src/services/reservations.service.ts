import api from './api'

export const reservationsService = {
  create: async (data: object) => {
    const res = await api.post('/reservations', data)
    return res.data
  },

  getAll: async (params?: object) => {
    const res = await api.get('/reservations', { params })
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/reservations/${id}`)
    return res.data
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/reservations/${id}/status`, { status })
    return res.data
  },
}
