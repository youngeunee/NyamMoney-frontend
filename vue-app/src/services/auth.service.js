import api from '@/api/axios'

export function login(body) {
  return api.post('/v1/auth/login', body)
}

export function logout() {
  // Authorization 헤더는 axios 인터셉터에서 accessToken으로 자동 첨부
  return api.post('/v1/auth/logout')
}

/**
 * accessToken 재발급
 * (보통 store나 axios interceptor에서만 사용)
 * @param {string} refreshToken
 */
export function refresh(refreshToken) {
  // refreshToken을 명시하면 헤더로 보내고, 없으면 쿠키 기반으로 요청
  const config = refreshToken
    ? { headers: { 'Refresh-Token': refreshToken } }
    : undefined
  return api.post('/v1/auth/refresh', null, config)
}
