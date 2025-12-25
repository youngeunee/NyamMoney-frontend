import { Client } from '@stomp/stompjs'
import Cookies from 'js-cookie'
import api from '@/api/axios'

let stompClient = null

export function connectChallengeChat(challengeId, onMessage) {
  const token = Cookies.get('accessToken')
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const wsHost = import.meta.env.VITE_WS_HOST || '54.180.94.25'
  const defaultPort = wsHost.includes(':') ? '' : (import.meta.env.VITE_WS_PORT ?? '8080')
  const wsPort = defaultPort ? `:${defaultPort}` : ''
  const wsPath = import.meta.env.VITE_WS_CHALLENGE_PATH || '/ws-challenge-chat'
  const wsUrl = `${wsProtocol}://${wsHost}${wsPort}${wsPath}`

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
