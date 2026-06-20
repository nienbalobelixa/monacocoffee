import api from './api'

export const reportsService = {
  daily: async (date?: string) => {
    const res = await api.get('/reports/daily', { params: { date } })
    return res.data
  },

  monthly: async (year: number, month: number) => {
    const res = await api.get('/reports/monthly', { params: { year, month } })
    return res.data
  },

  yearly: async (year: number) => {
    const res = await api.get('/reports/yearly', { params: { year } })
    return res.data
  },
}
