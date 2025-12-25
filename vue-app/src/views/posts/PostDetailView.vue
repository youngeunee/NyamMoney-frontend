<template>
  <div class="p-6 max-w-4xl mx-auto space-y-4">
    <!-- ✅ 게시글 + 댓글 목록(여기까지만 border 적용) -->
    <div class="border border-border rounded-md bg-white shadow-sm divide-y divide-border">
      <!-- 헤더 -->
      <div class="p-4 flex items-start justify-between gap-2">
        <div>
          <button
            type="button"
            class="text-xs text-foreground hover:underline underline-offset-2"
            @click="goBoardList"
          >
            {{ boardTitle }}
          </button>

          <h1 class="text-2xl font-bold text-foreground">
            {{ post?.title || '제목 없음' }}
          </h1>

          <div class="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <button
              v-if="post?.author?.nickname"
              class="text-foreground font-medium hover:underline"
              @click="goProfile(post.author.userId)"
            >
              {{ post.author.nickname }}
            </button>
            <span v-else>익명</span>
            <span class="text-muted-foreground">· {{ formatDateBrief(post?.createdAt) }}</span>
          </div>
        </div>

        <div v-if="post?.author?.userId === authStore.userId" class="flex items-center gap-2">
          <UiButton variant="ghost" class="h-9 text-sm" @click="goEdit">수정</UiButton>
          <UiButton variant="destructive" class="h-9 text-sm px-3" @click="handleDelete">삭제</UiButton>
        </div>
      </div>

      <!-- 본문 -->
      <div class="p-4 space-y-4">
        <div class="text-sm text-foreground whitespace-pre-line">
          {{ post?.content }}
        </div>

        <div class="flex items-center gap-2">
          <UiButton
            variant="secondary"
            class="h-auto p-0 px-0 py-0
         bg-transparent hover:bg-transparent active:bg-transparent
         shadow-none
         text-xs"
            @click="toggleLike"
            :aria-label="post?.liked ? '좋아요 취소' : '좋아요'"
          >
            <span v-if="post?.liked">♥ {{ post?.likeCount }}</span>
            <span v-else>♡ {{ post?.likeCount }}</span>
          </UiButton>
          <span class="text-xs text-muted-foreground">
            댓글 {{ commentCount }} 
          </span>
        </div>

      </div>

      <!-- 댓글 목록 -->
      <CommentListView
        class="px-4"
        :boardId="boardId"
        :postId="postId"
        :showCreateForm="false"
      />
    </div>

    <!-- ✅ 댓글 입력(카드 밖이라 border 영향 없음, 위치는 바로 아래로 유지) -->
    <div>
      <CommentForm
        :boardId="boardId"
        :postId="postId"
        @submitted="onCommentAdded"
      />
    </div>
  </div>
</template>


<script>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post.store'
import { storeToRefs } from 'pinia'
import CommentListView from '@/views/comments/CommentListView.vue'
import CommentForm from '@/components/comments/CommentForm.vue'
import { useAuthStore } from '@/stores/auth'
import UiButton from '@/components/ui/Button.vue'
import { fetchBoards } from '@/services/board.service'

export default {
  components: {
    CommentListView,
    UiButton,
    CommentForm,
  },

  props: {
    boardId: {
      type: Number,
      required: true,
    },
    postId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter()
    const postStore = usePostStore()
    const authStore = useAuthStore()
    const { post } = storeToRefs(postStore)
    const profileTarget = ref(null)
    const boardTitleFallback = ref('게시글')
    const boardTitle = computed(
      () => post.value?.boardName || post.value?.board?.name || boardTitleFallback.value || '게시글'
    )
    const commentCount = ref(0)

    const loadBoardTitle = async () => {
      if (post.value?.boardName || post.value?.board?.name) return
      try {
        const res = await fetchBoards()
        const items = res?.data?.items || res?.data?.content || []
        const found = items.find((b) => (b.boardId ?? b.id) === Number(props.boardId))
        if (found?.name) {
          boardTitleFallback.value = found.name
        }
      } catch (e) {
        // ignore; fallback keeps default
      }
    }

    // 게시글 상세 조회
    onMounted(async () => {
      await postStore.loadPostDetail(props.boardId, props.postId)
      await loadBoardTitle()
    })

    watch(
      () => post.value?.commentCount,
      (v) => {
        commentCount.value = v ?? 0
      },
      { immediate: true }
    )

    const goEdit = () => {
      router.push({
        name: 'postEdit',
        params: {
          boardId: props.boardId,
          postId: props.postId,
        },
      })
    }

    const handleDelete = async () => {
      if (!confirm('게시글을 삭제하시겠습니까?')) return

      await postStore.removePost(props.boardId, props.postId)

      router.push({
        name: 'boardPosts',
        params: { boardId: props.boardId },
      })
    }

    const toggleLike = async () => {
      await postStore.toggleLike(props.boardId, props.postId)
    }

    const goBoardList = () => {
      router.push({
        name: 'boardPosts',
        params: { boardId: props.boardId },
      })
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

    const goProfile = (userId) => {
      if (!userId) return
      router.push({
        name: 'UserProfileParam',
        params: { userId },
      })
    }

    const onCommentAdded = () => {
      commentCount.value = (commentCount.value || 0) + 1
      if (post.value) post.value.commentCount = commentCount.value
    }

    return {
      post,
      authStore,
      goEdit,
      handleDelete,
      toggleLike,
      profileTarget,
      goProfile,
      formatDateBrief,
      goBoardList,
      boardTitle,
      commentCount,
      onCommentAdded,
    }
  },
}
</script>

<style scoped>
</style>
