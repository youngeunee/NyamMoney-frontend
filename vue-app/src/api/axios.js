import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// ✅ 공통 axios 인스턴스
const api = axios.create({
  baseURL: '/api', // 또는 배포 후 https://api.your-domain.com
  withCredentials: true,
})

// ======= Request Interceptor: 매 요청마다 accessToken 붙이기 =======
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore?.accessToken
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ======= Response Interceptor: 401 발생 시 refresh 시도 =======
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken))
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

    // access token 만료 등으로 401이 떨어졌고, 아직 재시도 안 했을 때만 처리
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true

      const refreshToken = authStore?.refreshToken

      // refreshToken 없으면 로그아웃
      if (!refreshToken) {
        if (authStore) authStore.logout()
        return Promise.reject(error)
      }

      // 이미 다른 요청이 refresh 중이면 새 토큰 발급을 기다렸다가 재요청
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (!newToken) {
              reject(error)
              return
            }
            originalConfig.headers = originalConfig.headers || {}
            originalConfig.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalConfig))
          })
        })
      }

      // refresh 시도 시작
      isRefreshing = true

      try {
        const res = await api.post('/v1/auth/refresh', null, {
          headers: { 'Refresh-Token': refreshToken },
        })

        const newAccessToken = res.data.accessToken
        const newRefreshToken = res.data.refreshToken

        // 스토어에만 토큰 저장 (쿠키 미사용)
        if (authStore && newAccessToken) {
          authStore.setTokens(newAccessToken, newRefreshToken)
        }

        // 기다리던 요청들에 새 토큰 전달
        onRefreshed(newAccessToken)

        // 원래 요청 재시도
        originalConfig.headers = originalConfig.headers || {}
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalConfig)
      } catch (refreshError) {
        if (authStore) authStore.logout()
        onRefreshed(null)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
