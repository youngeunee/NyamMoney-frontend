import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/services/auth.service'
import { refresh as refreshApi } from '@/services/auth.service'

const ACCESS_TOKEN_KEY = 'auth.accessToken'
const REFRESH_TOKEN_KEY = 'auth.refreshToken'

// base64url -> base64 디코드
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

function isExpired(payload, skewSeconds = 10) {
  if (!payload?.exp) return false
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now + skewSeconds
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userId: null,
    loginId: null,
    nickname: null,
    role: null,
    isAuthenticated: false,
    loading: false,
    accessToken: null,
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

      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      else localStorage.removeItem(ACCESS_TOKEN_KEY)

      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      else localStorage.removeItem(REFRESH_TOKEN_KEY)
    },

    // 서버 세션(레디스) 건드리지 않는 로컬 리셋
    $resetAuth() {
      this.userId = null
      this.loginId = null
      this.nickname = null
      this.isAuthenticated = false
      this.loading = false
      this.role = null
      this.accessToken = null
      this.refreshToken = null
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    },

    // accessToken 기반으로 사용자 상태 복원 (디코드 실패 시 서버 logout 호출 금지)
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

    // 앱 시작 시 1회 호출: localStorage + (필요 시) refresh
    async restoreFromRefresh() {
      if (!this.accessToken) {
        const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (storedAccess) this.accessToken = storedAccess
      }
      if (!this.refreshToken) {
        const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
        if (storedRefresh) this.refreshToken = storedRefresh
      }

      // accessToken이 있고, 디코드 가능 + 만료 아님 => 바로 복구
      if (this.accessToken) {
        const payload = decodeJwtPayload(this.accessToken)
        if (payload && !isExpired(payload)) {
          this.setAuthFromToken()
          return
        }
        // 만료/디코드 실패면 access 제거하고 refresh로 진행
        this.accessToken = null
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      }

      // refreshToken도 없으면 복구 불가
      if (!this.refreshToken) {
        this.$resetAuth()
        return
      }

      // refresh 시도
      try {
        const res = await refreshApi(this.refreshToken)
        const data = res.data

        const newAccess = data?.accessToken
        const newRefresh = data?.refreshToken ?? this.refreshToken

        if (!newAccess) {
          this.$resetAuth()
          return
        }

        this.setTokens(newAccess, newRefresh)
        this.setAuthFromToken()
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
        this.isAuthenticated = true

        this.setTokens(data.accessToken, data.refreshToken)
      } finally {
        this.loading = false
      }
    },

    // “사용자 클릭 로그아웃”에서만 서버 logout 호출
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        console.warn('Server logout failed – ignored.')
      }
      this.setTokens(null, null)
      this.$resetAuth()
    },

    // 401/복구 실패 시 강제 로그아웃용 (서버 세션 삭제하지 않음)
    forceLogoutLocalOnly() {
      this.setTokens(null, null)
      this.$resetAuth()
    },
  },
})
