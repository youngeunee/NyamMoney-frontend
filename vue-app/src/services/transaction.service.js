import api from '@/api/axios'

export function fetchTransactionSummary(params) {
  return api.get('/v1/transactions/summary', { params })
}

export function fetchTransactionDailySummary(params) {
  return api.get('/v1/transactions/daily-summary', { params })
}

export function fetchTransactions(params) {
  return api.get('/v1/transactions', { params })
}

export function createTransaction(payload) {
  return api.post('/v1/transactions', payload)
}

export function fetchTransactionDetail(transactionId) {
  return api.get(`/v1/transactions/${transactionId}`)
}

export function updateTransaction(transactionId, payload) {
  return api.patch(`/v1/transactions/${transactionId}`, payload)
}

export function deleteTransaction(transactionId) {
  return api.delete(`/v1/transactions/${transactionId}`)
}

export function classifyTransactionCategory(params) {
  return api.get('/v1/transactions/classify', { params })
}
