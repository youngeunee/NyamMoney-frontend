<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <template v-for="(board, idx) in boardTabs" :key="board.boardId">
          <span v-if="idx > 0" class="text-muted-foreground">|</span>
          <button
            type="button"
            @click="goBoard(board.boardId)"
            :class="[
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              activeBoardId === board.boardId ? 'text-primary' : 'text-foreground hover:text-primary'
            ]"
          >
            {{ board.name }}
          </button>
        </template>
      </div>

      <div class="ml-auto flex items-center gap-3 justify-end min-h-[40px]">
        <label class="text-sm text-muted-foreground" for="sort"></label>
        <select
          id="sort"
          v-model="selectedSort"
          class="text-sm bg-transparent text-foreground focus:outline-none h-9"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <button
          v-if="canCreate"
          class="px-4 py-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition"
          @click="goNewPost"
        >
          글쓰기
        </button>
      </div>
    </div>

    <div class="border border-border rounded-md bg-card">
      <div v-if="posts.length > 0" class="divide-y divide-border">
        <button
          v-for="post in posts"
          :key="post.postId"
          @click="goDetail(post.postId)"
          class="w-full text-left px-4 py-3 flex flex-col gap-2 hover:bg-accent/60 transition"
          type="button"
        >
          <h2 class="font-semibold text-foreground line-clamp-1">{{ post.title || '제목 없음' }}</h2>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ snippet(post.content) }}</p>
          <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>댓글 {{ post.commentCount }}</span>
            <span class="text-muted-foreground">|</span>
            <span>좋아요 {{ post.likeCount }}</span>
            <span class="text-muted-foreground">|</span>
            <span>{{ formatDateBrief(post.createdAt) }}</span>
            <span class="text-muted-foreground">|</span>
            <button
              type="button"
              class="text-left underline-offset-2 hover:underline"
              @click.stop="goProfile(post.author?.userId)"
            >
              {{ post.author?.nickname || '익명' }}
            </button>
          </div>
        </button>
      </div>

      <div
        v-if="loading && posts.length === 0"
        class="min-h-[180px] p-12 flex items-center justify-center text-sm text-muted-foreground"
      >
        게시글을 불러오는 중...
      </div>
      <div
        v-if="!loading && posts.length === 0"
        class="min-h-[180px] p-12 flex items-center justify-center text-sm text-muted-foreground"
      >
        게시글이 없습니다.
      </div>

      <div ref="sentinel" class="h-2"></div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useBoardStore } from '@/stores/board.store'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { fetchBoards } from '@/services/board.service'

export default {
  props: {
    boardId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const boardStore = useBoardStore()
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()

    const { posts, loading, hasNext } = storeToRefs(boardStore)
    const { isAuthenticated } = storeToRefs(authStore)
    const userRole = computed(() => authStore.role)

    const sortOptions = [
      { value: 'comments', label: '댓글순' },
      { value: 'likes', label: '좋아요순' },
      { value: 'latest', label: '최신순' },
    ]
    const selectedSort = ref('latest')
    const boardTabs = ref([
      { boardId: 5, name: '공지' },
      { boardId: 1, name: '전체' },
      { boardId: 2, name: '자유' },
      { boardId: 3, name: '질문' },
      { boardId: 4, name: '팁' },
    ])

    const sentinel = ref(null)
    let observer = null
    const activeBoardId = computed(() => Number(route.params.boardId) || props.boardId)

    const loadBoards = async () => {
      try {
        const res = await fetchBoards()
        const items = res?.data?.items || res?.data?.content || []
        if (items.length) {
          const mapped = items.map((b) => ({
            boardId: b.boardId ?? b.id,
            name: b.name ?? '게시판',
          }))
          mapped.sort((a, b) => {
            const aNotice = String(a.name).includes('공지')
            const bNotice = String(b.name).includes('공지')
            if (aNotice && !bNotice) return -1
            if (!aNotice && bNotice) return 1
            return (a.boardId ?? 0) - (b.boardId ?? 0)
          })
          boardTabs.value = mapped
        }
      } catch (e) {
        // fallback defaults
      }
    }

    const loadInitial = async () => {
      if (!isAuthenticated.value) return
      await boardStore.loadBoardPosts(activeBoardId.value, {
        append: false,
        sort: selectedSort.value,
      })
    }

    const loadMore = async () => {
      if (!hasNext.value || loading.value) return
      await boardStore.loadBoardPosts(activeBoardId.value, {
        append: true,
        sort: selectedSort.value,
      })
    }

    const setupObserver = async () => {
      await nextTick()
      if (observer && sentinel.value) observer.unobserve(sentinel.value)
      observer = null

      if (!sentinel.value) return
      observer = new IntersectionObserver(
        (entries) => {
          if (entries?.[0]?.isIntersecting) {
            loadMore()
          }
        },
        { root: null, rootMargin: '120px', threshold: 0 }
      )
      observer.observe(sentinel.value)
    }

    onMounted(async () => {
      await loadBoards()
      await loadInitial()
      await setupObserver()
    })

    onBeforeUnmount(() => {
      if (observer && sentinel.value) observer.unobserve(sentinel.value)
      observer = null
    })

    watch(
      () => isAuthenticated.value,
      async (loggedIn) => {
        if (loggedIn) {
          await loadInitial()
          await setupObserver()
        } else {
          boardStore.resetState()
        }
      },
      { immediate: true }
    )
    
    watch(
      () => activeBoardId.value,
      async () => {
        selectedSort.value = 'latest'
        await loadInitial()
        await setupObserver()
      }
    )

    watch(selectedSort, async () => {
      await loadInitial()
      await setupObserver()
    })

    const goBoard = (boardId) => {
      router.push({
        name: 'boardPosts',
        params: { boardId },
      })
    }

    const goDetail = (postId) => {
      router.push({
        name: 'postDetail',
        params: {
          boardId: activeBoardId.value,
          postId,
        },
      })
    }

    const goProfile = (userId) => {
      if (!userId) return
      router.push({
        name: 'UserProfileParam',
        params: { userId },
      })
    }

    const isNoticeBoard = computed(() =>
      Number(activeBoardId.value) === 4 ||
      (props.title && String(props.title).includes('공지'))
    )
    const canCreate = computed(() =>
      isAuthenticated.value &&
      (!isNoticeBoard.value || userRole.value === 'ADMIN')
    )

    const goNewPost = () => {
      if (!canCreate.value) return
      router.push({
        name: 'newPost',
        params: {
          boardId: activeBoardId.value,
        },
      })
    }

    const snippet = (value) => {
      if (!value) return ''
      const trimmed = String(value).trim()
      return trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed
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
      posts,
      loading,
      sortOptions,
      selectedSort,
      sentinel,
      goDetail,
      goNewPost,
      canCreate,
      goBoard,
      boardTabs,
      activeBoardId,
      snippet,
      formatDateBrief,
      goProfile,
    }
  },
}
</script>
