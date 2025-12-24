<template>
  <div class="space-y-3">
    <!-- 메시지 목록 -->
    <div class="h-64 overflow-y-auto border border-border bg-white rounded-md p-3 space-y-2">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="text-sm text-foreground"
      >
        <span class="font-semibold text-foreground">{{ msg.senderNickname }}: </span>
        <span class="text-muted-foreground">{{ msg.content }}</span>
      </div>
      <p v-if="messages.length === 0" class="text-sm text-muted-foreground">메시지가 없습니다.</p>
    </div>

    <!-- 입력 -->
    <div class="flex gap-2 items-center">
      <input
        v-model="input"
        @keyup.enter="send"
        class="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none"
        placeholder="메시지를 입력하세요"
      />
      <button
        @click="send"
        class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:cursor-not-allowed"
        :disabled="!input.trim()"
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
