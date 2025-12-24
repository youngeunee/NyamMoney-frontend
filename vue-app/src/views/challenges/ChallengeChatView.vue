<template>
  <div class="border rounded-xl p-4 bg-white">
    <h3 class="font-semibold mb-3">챌린지 채팅</h3>

    <!-- 메시지 목록 -->
    <div class="h-64 overflow-y-auto border p-2 mb-3">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="mb-1 text-sm"
      >
        <b>{{ msg.senderNickname }}:</b>
        {{ msg.content }}
      </div>
    </div>

    <!-- 입력 -->
    <div class="flex gap-2">
      <input
        v-model="input"
        @keyup.enter="send"
        class="flex-1 border rounded px-2 py-1"
        placeholder="메시지를 입력하세요"
      />
      <button
        @click="send"
        class="px-3 py-1 rounded bg-orange-400 text-white"
      >
        전송
      </button>
    </div>
  </div>
</template>

<script>
import {
  connectChallengeChat,
  sendChallengeMessage,
  disconnectChallengeChat
} from '@/services/challengeChat.service'

export default {
  props: {
    challengeId: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      messages: [],
      input: ''
    }
  },

  mounted() {
    console.log('[CHAT] mounted, challengeId =', this.challengeId)
    connectChallengeChat(this.challengeId, (message) => {
      this.messages.push(message)
      this.$nextTick(() => {
        const box = this.$el.querySelector('.overflow-y-auto')
        box.scrollTop = box.scrollHeight
      })
    })
  },

  beforeUnmount() {
    disconnectChallengeChat()
  },

  methods: {
    send() {
      if (!this.input.trim()) return

      sendChallengeMessage({
        challengeId: this.challengeId,
        content: this.input
      })

      this.input = ''
    }
  }
}
</script>
