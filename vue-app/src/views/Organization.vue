<template>
  <Layout>
    <div class="p-8 space-y-6">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="board in boardTabs"
          :key="board.boardId"
          @click="goBoard(board.boardId)"
          :class="[
            'px-3 py-1.5 rounded-full border text-sm transition-colors',
            isActive(board.boardId)
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          ]"
          type="button"
        >
          {{ board.name }}
        </button>
      </div>

      <router-view />
    </div>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout.vue'
import BoardPosts from '@/views/boards/BoardPostsView.vue'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { fetchBoards } from '@/services/board.service'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const boardTabs = ref([
      { boardId: 1, name: '전체' },
      { boardId: 2, name: '자유' },
      { boardId: 3, name: '질문' },
      { boardId: 4, name: '팁' },
      { boardId: 5, name: '공지' },
    ])

    const loadBoards = async () => {
      try {
        const res = await fetchBoards()
        const items = res?.data?.items || res?.data?.content || []
        if (items.length) {
          boardTabs.value = items.map((b) => ({
            boardId: b.boardId ?? b.id,
            name: b.name ?? '게시판',
          }))
        }
      } catch (e) {
        // fallback to defaults
      }
    }

    onMounted(() => {
      loadBoards()
    })

    const goBoard = (boardId) => {
      router.push({
        name: 'boardPosts',
        params: { boardId },
      })
    }

    const isActive = (boardId) => Number(route.params.boardId) === Number(boardId)

    return { goBoard, boardTabs, isActive }
  },

  components: {
    Layout,
    BoardPosts,
  },
}
</script>
