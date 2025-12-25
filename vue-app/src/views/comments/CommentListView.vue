<template>
  <div>
    <p v-if="loading">댓글을 불러오는 중...</p>

    <template v-else>
      <div ref="commentTop" class="comment-scroll-anchor"></div>

      <ul class="divide-y divide-border -mx-4">
        <li
          v-for="comment in comments"
          :key="comment.commentId"
          class="px-4 py-3 w-full"
        >
          <div v-if="editingCommentId === comment.commentId">
            <textarea
              v-model="editingContent"
              rows="2"
              class="w-full p-2 border rounded"
            />
            <div class="mt-2 text-right">
              <button @click="saveEdit(comment.commentId)">저장</button>
              <button @click="cancelEdit"> 취소</button>
            </div>
          </div>

          <div v-else>
            <div class="flex items-center text-xs font-semibold w-full">
              <button
                class="text-gray-800 hover:underline"
                @click="goProfile(comment.author?.userId)"
              >
                {{ comment.author?.nickname || '익명' }}
              </button>
              <div
                v-if="isMyComment(comment) && editingCommentId !== comment.commentId"
                class="flex items-center gap-2 ml-auto text-gray-400"
              >
                <button class="text-xs" @click="startEdit(comment)">수정</button>
                <span class="text-gray-300">|</span>
                <button class="text-xs" @click="deleteComment(comment.commentId)">삭제</button>
              </div>
            </div>
            <p class="text-sm">{{ comment.content }}</p>
            <p class="text-xs text-gray-400">
              {{ formatDateBrief(comment.updatedAt) }}
            </p>
          </div>
        </li>
      </ul>
      <div ref="commentBottom" class="comment-scroll-bottom"></div>
    </template>

    <div v-if="showCreateForm" class="mt-6">
      <CommentCreateForm
        v-if="isAuthenticated"
        :boardId="boardId"
        :postId="postId"
        @submitted="handleCommentSubmitted"
      />
      <p v-else class="text-sm text-gray-400">
        로그인 후 댓글을 작성할 수 있습니다.
      </p>
    </div>

    <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
      <button
        v-for="p in totalPages"
        :key="p"
        @click="goPage(p - 1)"
        :disabled="loading"
        class="px-3 py-1 border rounded"
        :class="{
          'bg-orange-500 text-white': page === p - 1,
        }"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useCommentStore } from '@/stores/comment.store'
import { useAuthStore } from '@/stores/auth'
import CommentCreateForm from '@/components/comments/CommentForm.vue'
import { useRouter } from 'vue-router'

export default {
  components: {
    CommentCreateForm,
  },

  props: {
    boardId: {
      type: [Number, String],
      required: true,
    },
    postId: {
      type: [Number, String],
      required: true,
    },
    showCreateForm: {
      type: Boolean,
      default: true,
    },
  },

  setup(props) {
    const authStore = useAuthStore()
    const router = useRouter()
    const commentStore = useCommentStore()
    const { comments, loading, page, totalPages } = storeToRefs(commentStore)
    const commentTop = ref(null)
    const commentBottom = ref(null)

    const editingCommentId = ref(null)
    const editingContent = ref('')

    const isAuthenticated = authStore.isAuthenticated

    const isMyComment = (comment) => comment.author?.userId === authStore.userId

    onMounted(() => {
      commentStore.loadComments(props.boardId, props.postId)
    })

    const goPage = async (p) => {
      await commentStore.loadComments(props.boardId, props.postId, p)
      await nextTick()
      commentTop.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }

    const handleCommentSubmitted = async (targetPage) => {
      const currentY = window.scrollY
      await commentStore.loadComments(props.boardId, props.postId, targetPage ?? page.value)
      await nextTick()
      window.scrollTo({
        top: currentY,
        behavior: 'auto',
      })
    }

    const goProfile = (userId) => {
      if (!userId) return
      router.push({
        name: 'UserProfileParam',
        params: { userId },
      })
    }

    const startEdit = (comment) => {
      editingCommentId.value = comment.commentId
      editingContent.value = comment.content
    }

    const cancelEdit = () => {
      editingCommentId.value = null
      editingContent.value = ''
    }

    const saveEdit = async (commentId) => {
      await commentStore.updateComment(
        props.boardId,
        props.postId,
        commentId,
        editingContent.value
      )
      cancelEdit()
    }

    const deleteComment = async (commentId) => {
      if (!confirm('댓글을 삭제하시겠습니까?')) return
      await commentStore.deleteComment(
        props.boardId,
        props.postId,
        commentId
      )
    }

    const formatDateBrief = (value) => {
      if (!value) return ''
      const d = new Date(value)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin >= 0 && diffMin < 60) {
        return `${diffMin}분 전`
      }
      const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      if (sameDay) {
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      const pad = (n) => String(n).padStart(2, '0')
      return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
    }

    return {
      comments,
      loading,
      page,
      totalPages,
      goPage,
      commentTop,
      commentBottom,
      editingCommentId,
      editingContent,
      startEdit,
      cancelEdit,
      saveEdit,
      isMyComment,
      isAuthenticated,
      deleteComment,
      handleCommentSubmitted,
      goProfile,
      formatDateBrief,
    }
  },
}
</script>

<style lang="css">
  .comment-scroll-anchor {
    scroll-margin-top: 100px;
  }

  .comment-scroll-bottom {
    height: 1px;
  }
</style>
