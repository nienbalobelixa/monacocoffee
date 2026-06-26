import api from './api'

export const usersService = {
  getAll: async (params?: object) => {
    const res = await api.get('/users', { params })
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/users/${id}`)
    return res.data
  },

  getProfile: async () => {
    const res = await api.get('/users/me')
    return res.data
  },

  updateProfile: async (data: object) => {
    const res = await api.patch('/users/me/profile', data)
    return res.data
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const res = await api.patch('/users/me/password', data)
    return res.data
  },

  toggleActive: async (id: string) => {
    const res = await api.patch(`/users/${id}/toggle-active`)
    return res.data
  },
}
