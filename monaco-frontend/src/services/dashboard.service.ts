import api from './api'

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats')
    return res.data
  },

  getRevenueChart: async (days: number = 7) => {
    const res = await api.get('/dashboard/revenue-chart', { params: { days } })
    return res.data
  },
}
