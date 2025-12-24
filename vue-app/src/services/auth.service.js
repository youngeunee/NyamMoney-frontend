import api from '@/api/axios'

export function login(body) {
  return api.post('/v1/auth/login', body)
}

export function logout() {
  // httpOnly 쿠키로 인증
  return api.post('/v1/auth/logout')
}

/**
 * accessToken 재발급 (store/axios interceptor에서 사용)
 */
export function refresh() {
  // httpOnly 쿠키 기반이라 별도 헤더 없이 호출
  return api.post('/v1/auth/refresh')
}
