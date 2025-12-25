<template>
  <div class="space-y-3">
    <!-- 메시지 목록 -->
    <div
      ref="chatBody"
      class="chat-body h-64 overflow-y-auto border border-border bg-white rounded-md p-3 space-y-2"
    >
      <div
        v-for="(msg, idx) in messages"
        :key="`wrap-${idx}`"
        class="space-y-2"
      >
        <div v-if="shouldShowDate(idx)" class="flex justify-center">
          <span class="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
            {{ formatDateLabel(msg.sentAt) }}
          </span>
        </div>

        <div :class="['flex', isMine(msg) ? 'justify-end' : 'justify-start']">
          <div
            :class="[
              'flex flex-col gap-1 max-w-[80%]',
              isMine(msg) ? 'items-end text-right' : 'items-start text-left'
            ]"
          >
            <span
              v-if="shouldShowName(idx)"
              class="text-xs font-semibold text-muted-foreground"
            >
              {{ isMine(msg) ? '나' : msg.senderNickname }}
            </span>
            <div class="flex items-end gap-2" :class="isMine(msg) ? 'justify-end' : 'justify-start'">
              <template v-if="isMine(msg)">
                <span class="text-[11px] text-muted-foreground">
                  {{ formatTime(msg.sentAt) }}
                </span>
                <div
                  :class="[
                    'inline-flex px-3 py-2 rounded-md whitespace-pre-wrap text-sm',
                    'bg-primary text-primary-foreground'
                  ]"
                >
                  {{ msg.content }}
                </div>
              </template>
              <template v-else>
                <div
                  :class="[
                    'inline-flex px-3 py-2 rounded-md whitespace-pre-wrap text-sm',
                    'bg-muted text-foreground'
                  ]"
                >
                  {{ msg.content }}
                </div>
                <span class="text-[11px] text-muted-foreground">
                  {{ formatTime(msg.sentAt) }}
                </span>
              </template>
            </div>
          </div>
        </div>
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
  disconnectChallengeChat,
  fetchChallengeChats
} from '@/services/challengeChat.service'
import { useAuthStore } from '@/stores/auth'

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
      input: '',
      authStore: useAuthStore(),
      loadingMore: false,
      hasMore: true,
      pageSize: 30,
    }
  },

  async mounted() {
    await this.loadInitial()

    connectChallengeChat(this.challengeId, (message) => {
      this.messages.push(message)
      this.$nextTick(() => {
        const box = this.$refs.chatBody
        if (box) box.scrollTop = box.scrollHeight
      })
    })

    const box = this.$refs.chatBody
    if (box) {
      box.addEventListener('scroll', this.onScroll)
    }
  },

  beforeUnmount() {
    const box = this.$refs.chatBody
    if (box) {
      box.removeEventListener('scroll', this.onScroll)
    }
    disconnectChallengeChat()
  },

  methods: {
    isMine(msg) {
      return msg?.senderId === this.authStore.userId
    },

    shouldShowName(idx) {
      const current = this.messages[idx]
      if (!current) return false
      if (idx === 0) return true

      const prev = this.messages[idx - 1]
      const sameSender = current.senderId === prev?.senderId
      const sameTime = this.formatTime(current.sentAt) === this.formatTime(prev?.sentAt)

      return !(sameSender && sameTime)
    },

    shouldShowDate(idx) {
      const current = this.messages[idx]
      if (!current) return false
      if (idx === 0) return true

      const prev = this.messages[idx - 1]
      return this.formatDateLabel(current.sentAt) !== this.formatDateLabel(prev?.sentAt)
    },

    formatDateLabel(value) {
      if (!value) return ''
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
    },

    formatTime(value) {
      if (!value) return ''
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`
    },

    async loadInitial() {
      const res = await fetchChallengeChats(this.challengeId, { size: this.pageSize })
      const items = Array.isArray(res?.data) ? res.data : []
      this.messages = items
      this.hasMore = items.length === this.pageSize
      this.$nextTick(this.scrollToBottom)
    },

    async loadOlder() {
      if (this.loadingMore || !this.hasMore || this.messages.length === 0) return
      this.loadingMore = true

      const box = this.$refs.chatBody
      const prevHeight = box?.scrollHeight || 0
      const before = this.messages[0]?.sentAt

      try {
        const res = await fetchChallengeChats(this.challengeId, {
          before,
          size: this.pageSize,
        })
        const older = Array.isArray(res?.data) ? res.data : []
        if (older.length === 0) {
          this.hasMore = false
          return
        }
        this.messages = [...older, ...this.messages]
        if (older.length < this.pageSize) this.hasMore = false
        this.$nextTick(() => {
          if (box) {
            const newHeight = box.scrollHeight
            box.scrollTop = newHeight - prevHeight
          }
        })
      } finally {
        this.loadingMore = false
      }
    },

    onScroll() {
      const box = this.$refs.chatBody
      if (!box) return
      if (box.scrollTop <= 20) {
        this.loadOlder()
      }
    },

    send() {
      if (!this.input.trim()) return

      sendChallengeMessage({
        challengeId: this.challengeId,
        content: this.input
      })

      this.input = ''
    },

    scrollToBottom() {
        const box = this.$el.querySelector('.chat-body')
        if (box) box.scrollTop = box.scrollHeight
    }
  }
}
</script>
