import api from './api'

export const employeesService = {
  getAll: async (params?: object) => {
    const res = await api.get('/employees', { params })
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get(`/employees/${id}`)
    return res.data
  },

  update: async (id: string, data: object) => {
    const res = await api.patch(`/employees/${id}`, data)
    return res.data
  },
}
