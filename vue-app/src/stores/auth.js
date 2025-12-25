import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, refresh as refreshApi } from '@/services/auth.service'

// base64url -> base64 디코딩
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')

    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json)
  } catch (e) {
    console.warn('JWT decode failed:', e)
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userId: null,
    loginId: null,
    nickname: null,
    role: null,
    name: null,
    isAuthenticated: false,
    loading: false,
    accessToken: null, // 메모리 캐시 용도(헤더 전송X)
    refreshToken: null,
  }),

  getters: {
    accessPayload(state) {
      if (!state.accessToken) return null
      return decodeJwtPayload(state.accessToken)
    },
  },

  actions: {
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken ?? null
      this.refreshToken = refreshToken ?? null
    },

    // 서버 세션 상태 초기화
    $resetAuth() {
      this.userId = null
      this.loginId = null
      this.nickname = null
      this.role = null
      this.name = null
      this.isAuthenticated = false
      this.loading = false
      this.accessToken = null
      this.refreshToken = null
    },

    setAuthFromToken() {
      const token = this.accessToken
      if (!token) {
        this.$resetAuth()
        return
      }

      const payload = decodeJwtPayload(token)
      if (!payload) {
        this.$resetAuth()
        return
      }

      this.userId = payload.userId
      this.loginId = payload.loginId
      this.nickname = payload.nickname
      this.role = payload.role
      this.isAuthenticated = true
    },

    // 앱 시작 시 쿠키 기반 refresh 요청으로 복구
    async restoreFromRefresh() {
      try {
        const res = await refreshApi()
        const data = res.data

        const newAccess = data?.accessToken
        const newRefresh = data?.refreshToken ?? null

        if (!newAccess) {
          this.$resetAuth()
          return
        }

        this.setTokens(newAccess, newRefresh)

        if (data?.userId) {
          this.userId = data.userId
          this.loginId = data.loginId
          this.nickname = data.nickname
          this.role = data.role
          this.name = data.name
          this.isAuthenticated = true
        } else {
          this.setAuthFromToken()
        }
      } catch (e) {
        this.$resetAuth()
      }
    },

    async login({ loginId, password }) {
      this.loading = true
      try {
        const res = await loginApi({ loginId, password })
        const data = res.data

        this.userId = data.userId
        this.loginId = data.loginId
        this.nickname = data.nickname
        this.role = data.role
        this.name = data.name
        this.isAuthenticated = true

        this.setTokens(data.accessToken, data.refreshToken)
      } finally {
        this.loading = false
      }
    },

    // 서버 로그아웃 + 로컬 상태 정리
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        console.warn('Server logout failed – ignored.')
      }
      this.forceLogoutLocalOnly()
      window.location.replace('/')
    },

    // 401/refresh 실패 시 강제 로그아웃
    forceLogoutLocalOnly() {
      this.setTokens(null, null)
      this.$resetAuth()
    },
  },
})
