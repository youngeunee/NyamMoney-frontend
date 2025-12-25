<template>
  <Layout>
    <div class="p-6 max-w-3xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted-foreground">게시글 작성</p>
          <h1 class="text-2xl font-bold text-foreground">{{ boardTitle }} 글쓰기</h1>
        </div>
        <button
          class="px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition"
          type="button"
          @click="goList"
        >
          목록으로
        </button>
      </div>

      <div class="border border-border rounded-md bg-card divide-y divide-border">
        <div class="p-4 space-y-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">제목</label>
            <input
              v-model="title"
              type="text"
              placeholder="제목을 입력하세요"
              class="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">내용</label>
            <textarea
              v-model="content"
              rows="10"
              placeholder="내용을 입력하세요"
              class="w-full rounded-md border border-border bg-card p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div class="p-4 flex items-center justify-end gap-2">
          <button
            class="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition"
            type="button"
            @click="goList"
          >
            목록으로
          </button>
          <button
            class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            :disabled="creating"
            type="button"
            @click="submit"
          >
            {{ creating ? '작성 중...' : '등록' }}
          </button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post.store'
import { storeToRefs } from 'pinia'
import Layout from '@/components/Layout.vue'

export default {

  props: {
    boardId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter()
    const postStore = usePostStore()
    const { creating } = storeToRefs(postStore)

    const title = ref('')
    const content = ref('')

    // 게시판 이름 매핑
    const boardTitle = computed(() => {
      const map = {
        1: '자유게시판',
        2: '질문 게시판',
        3: '팁 게시판',
        4: '공지 게시판',
      }
      return map[props.boardId] || '게시판'
    })

    // 게시글 작성
    const submit = async () => {
      if (!title.value.trim() || !content.value.trim()) {
        alert('제목과 내용을 입력해주세요.')
        return
      }

      const result = await postStore.submitPost(
        props.boardId,
        title.value,
        content.value
      )

      // 작성한 게시글 상세로 이동
      router.push({
        name: 'postDetail',
        params: {
          boardId: result.boardId,
          postId: result.postId,
        },
      })
    }

    // 목록으로 이동
    const goList = () => {
      router.push({
        name: 'boardPosts',
        params: {
          boardId: props.boardId,
        },
      })
    }

    return {
      title,
      content,
      creating,
      boardTitle,
      submit,
      goList,
    }
  },
}
</script>

<style scoped>
</style>
