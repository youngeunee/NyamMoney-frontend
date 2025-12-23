import { Client } from '@stomp/stompjs'
import Cookies from 'js-cookie'

let stompClient = null

export function connectChallengeChat(challengeId, onMessage) {
  const token = Cookies.get('accessToken')
  console.log('WS TOKEN:', token)


  stompClient = new Client({
    // ✅ Spring STOMP에서는 이 방식이 정답
    webSocketFactory: () =>
      new WebSocket(`ws://localhost:8080/ws-challenge-chat?token=${token}`),
    

    // ✅ 재연결 폭주 방지
    reconnectDelay: 5000,

    connectHeaders: {
      Authorization: `Bearer ${token}`
    },

    debug: () => {},

    onConnect: () => {
      console.log('[WS] connected')

      stompClient.subscribe(
        `/topic/challenges/${challengeId}`,
        (frame) => {
          const body = JSON.parse(frame.body)
          onMessage(body)
        }
      )
    },

    onWebSocketError: (error) => {
      console.error('[WS] websocket error', error)
    },

    onStompError: (frame) => {
      console.error('[WS] stomp error', frame)
    }
  })

  stompClient.activate()
}

export function sendChallengeMessage(message) {
  if (!stompClient || !stompClient.connected) return

  stompClient.publish({
    destination: '/app/challenges/chat',
    body: JSON.stringify(message)
  })
}

export function disconnectChallengeChat() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}
