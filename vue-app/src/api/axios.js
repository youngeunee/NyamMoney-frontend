import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 공통 axios 인스턴스
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// ======= Request Interceptor: 별도 헤더 없이 쿠키 인증 사용 =======
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

// ======= Response Interceptor: 401 발생 시 refresh 시도 =======
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

    // signup/password-reset/refresh 요청에서는 추가 refresh 시도하지 않는다
    const isAuthFlow =
      url.includes('/v1/auth/refresh') ||
      url.includes('/v1/auth/signup') ||
      url.includes('/v1/auth/password')

    if (error.response && error.response.status === 401 && !originalConfig._retry && !isAuthFlow) {
      originalConfig._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (!success) {
              reject(error)
              return
            }
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
