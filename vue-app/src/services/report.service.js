import api from '@/api/axios'

export function fetchMonthlyReport(params = {}) {
  return api.get('/v1/ai/report/monthly', { params })
}

export function fetchDailyReport(params = {}) {
  return api.get('/v1/ai/report/daily', { params })
}
