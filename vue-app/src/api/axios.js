import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const baseURL =
  import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(success) {
  refreshSubscribers.forEach((cb) => cb(success))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config
    const authStore = useAuthStore()
    const url = originalConfig?.url || ''

    const isAuthFlow =
      url.includes('/v1/auth/refresh') ||
      url.includes('/v1/auth/signup') ||
      url.includes('/v1/auth/password')

    if (error.response && error.response.status === 401 && !originalConfig._retry && !isAuthFlow) {
      originalConfig._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (!success) return reject(error)
            resolve(api(originalConfig))
          })
        })
      }

      isRefreshing = true

      try {
        const res = await api.post('/v1/auth/refresh')
        const newAccessToken = res.data.accessToken
        const newRefreshToken = res.data.refreshToken

        if (authStore && newAccessToken) {
          authStore.setTokens(newAccessToken, newRefreshToken)
          authStore.setAuthFromToken()
        }

        onRefreshed(true)
        return api(originalConfig)
      } catch (refreshError) {
        if (authStore) authStore.forceLogoutLocalOnly()
        onRefreshed(false)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api