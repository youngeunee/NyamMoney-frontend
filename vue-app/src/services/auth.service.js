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

// 비밀번호 재설정: 인증코드 발송
export function sendPasswordResetCode(payload) {
  return api.post('/v1/auth/password/code', payload)
}

// 비밀번호 재설정: 인증코드 검증
export function verifyPasswordResetCode(payload) {
  return api.post('/v1/auth/password/verify', payload)
}

// 비밀번호 재설정: 새 비밀번호 확정
export function confirmPasswordReset(payload) {
  return api.post('/v1/auth/password/confirm', payload)
}
