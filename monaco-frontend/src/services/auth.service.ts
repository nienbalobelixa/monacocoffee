import api from './api'

export const authService = {
  register: async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    const res = await api.post('/auth/register', data)
    // res.data = { success, data: { user, accessToken, refreshToken }, message }
    return res.data.data ?? res.data
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data)
    return res.data.data ?? res.data
  },

  logout: async () => {
    const res = await api.post('/auth/logout')
    return res.data.data ?? res.data
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refreshToken })
    return res.data.data ?? res.data
  },

  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data.data ?? res.data
  },
}
