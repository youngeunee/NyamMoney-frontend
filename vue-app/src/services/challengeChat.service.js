import { Client } from '@stomp/stompjs'
import Cookies from 'js-cookie'
import api from '@/api/axios'

let stompClient = null

export function connectChallengeChat(challengeId, onMessage) {
  const token = Cookies.get('accessToken')
  // 고정 도메인으로 HTTPS 기반 WebSocket 연결
  const wsUrl = 'wss://api.nyammoney.kr/ws-challenge-chat'

  stompClient = new Client({
    webSocketFactory: () =>
      new WebSocket(wsUrl),

    connectHeaders: {
      Authorization: `Bearer ${token}`
    },

    reconnectDelay: 5000,

    onConnect: () => {
      console.log('[WS] connected')

      stompClient.subscribe(
        `/topic/challenges/${challengeId}`,
        (frame) => {
          onMessage(JSON.parse(frame.body))
        }
      )
    }
  })

  stompClient.activate()
}

export function sendChallengeMessage(message) {
  if (!stompClient || !stompClient.connected) {
    console.warn('[WS] not connected')
    return
  }

  stompClient.publish({
    destination: '/app/challenges/chat',
    body: JSON.stringify(message)
  })
}


export function disconnectChallengeChat() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
    console.log('[WS] disconnected')
  }
}

// 이전 채팅 내역 조회 (REST)
export function fetchChallengeChats(challengeId, { before, size } = {}) {
  // 조회용 REST 엔드포인트는 /api/challenges 로 노출되어 있어 /v1 prefix 없이 호출
  return api.get(`/v1/challenges/${challengeId}/chats`, {
    params: {
      before,
      size,
    },
  })
}
