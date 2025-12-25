<template>
  <div class="space-y-3">
    <textarea
      v-model="content"
      rows="3"
      placeholder="댓글을 입력하세요"
      class="w-full p-3 border border-border rounded resize-none"
    />

    <div class="flex items-center justify-between">
      <button
        type="button"
        class="px-4 py-2 rounded border border-border text-sm text-foreground hover:bg-accent transition"
        @click="goList"
      >
        목록으로
      </button>
      <button
        @click="submit"
        :disabled="creating"
        class="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 text-sm"
      >
        {{ creating ? '댓글 등록 중...' : '댓글 등록' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCommentStore } from '@/stores/comment.store'
import { storeToRefs } from 'pinia'

export default {
  emits: ['submitted'],
  props: {
    boardId: {
      type: [Number, String],
      required: true,
    },
    postId: {
      type: [Number, String],
      required: true,
    },
  },

  setup(props, { emit }) {
    const commentStore = useCommentStore()
    const { creating } = storeToRefs(commentStore)
    const router = useRouter()

    const content = ref('')

    const submit = async () => {
      const targetPage = await commentStore.submitComment(
        props.boardId,
        props.postId,
        content.value
      )
      if (targetPage === undefined) return
      content.value = '' // 입력값 초기화
      emit('submitted', targetPage)
    }

    const goList = () => {
      router.push({
        name: 'boardPosts',
        params: { boardId: props.boardId },
      })
    }

    return {
      content,
      submit,
      creating,
      goList,
    }
  },
}
</script>
