<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-gray-800">{{ title }}</h1>
        <p class="text-sm text-gray-500">게시글을 최신순/댓글순/좋아요순으로 살펴보세요.</p>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-sm text-gray-500">정렬</span>
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          @click="selectedSort = opt.value"
          :class="[
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            selectedSort === opt.value
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          ]"
          type="button"
        >
          {{ opt.label }}
        </button>
      </div>

      <button
        v-if="canCreate"
        class="px-4 py-2 bg-orange-500 text-white rounded-full shadow-sm hover:bg-orange-600 transition"
        @click="goNewPost"
      >
        글쓰기
      </button>
    </div>

    <p v-if="loading && posts.length === 0">게시글을 불러오는 중...</p>

    <ul v-if="posts.length > 0" class="space-y-3">
      <li
        v-for="post in posts"
        :key="post.postId"
        @click="goDetail(post.postId)"
        class="p-4 rounded-xl bg-white border border-gray-200 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h2 class="font-semibold text-gray-900 line-clamp-1">{{ post.title || '제목 없음' }}</h2>
            <p class="text-xs text-gray-500">작성자: {{ post.author?.nickname || '익명' }}</p>
            <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                댓글 {{ post.commentCount }}
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                좋아요 {{ post.likeCount }}
              </span>
            </div>
          </div>
          <span class="text-xs text-gray-400 whitespace-nowrap">{{ post.createdAt }}</span>
        </div>
      </li>
    </ul>

    <div v-if="loading && posts.length > 0" class="text-center text-gray-500 py-4">
      불러오는 중...
    </div>
    <div v-if="!loading && posts.length === 0" class="text-center text-gray-400 py-4">
      게시글이 없습니다.
    </div>

    <div ref="sentinel" class="h-8"></div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useBoardStore } from '@/stores/board.store'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

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

    const { posts, loading, hasNext } = storeToRefs(boardStore)
    const { isAuthenticated } = storeToRefs(authStore)
    const userRole = computed(() => authStore.role)

    const sortOptions = [
      { value: 'comments', label: '댓글순' },
      { value: 'likes', label: '좋아요순' },
      { value: 'latest', label: '최신순' },
    ]
    const selectedSort = ref('latest')

    const sentinel = ref(null)
    let observer = null

    const loadInitial = async () => {
      if (!isAuthenticated.value) return
      await boardStore.loadBoardPosts(props.boardId, {
        append: false,
        sort: selectedSort.value,
      })
    }

    const loadMore = async () => {
      if (!hasNext.value || loading.value) return
      await boardStore.loadBoardPosts(props.boardId, {
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
      () => props.boardId,
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

    const goDetail = (postId) => {
      router.push({
        name: 'postDetail',
        params: {
          boardId: props.boardId,
          postId,
        },
      })
    }

    const isNoticeBoard = computed(() =>
      Number(props.boardId) === 4 ||
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
          boardId: props.boardId,
        },
      })
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
    }
  },
}
</script>
