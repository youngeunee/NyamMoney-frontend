<template>
  <Layout>
    <div class="p-6 max-w-4xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <button class="px-3 py-2 rounded-md border border-border text-sm hover:bg-accent transition" @click="goList">
          목록으로
        </button>
        <div v-if="post?.author?.userId === authStore.userId" class="flex items-center gap-2">
          <button class="text-sm text-muted-foreground hover:text-foreground" @click="goEdit">수정</button>
          <button class="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-sm" @click="handleDelete">
            삭제
          </button>
        </div>
      </div>

      <div class="border border-border rounded-md bg-card">
        <div class="p-4 border-b border-border">
          <p class="text-xs text-muted-foreground">게시글</p>
          <h1 class="text-2xl font-bold text-foreground">{{ post?.title || '제목 없음' }}</h1>
          <div class="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <button
              v-if="post?.author?.nickname"
              class="text-foreground font-medium hover:underline"
              @click="toggleProfile(post.author.userId)"
            >
              {{ post.author.nickname }}
            </button>
            <span v-else>익명</span>
            <span class="text-muted-foreground">· {{ post?.createdAt }}</span>
          </div>
          <div v-if="profileTarget === post?.author?.userId" class="mt-2">
            <button
              class="text-[11px] text-primary hover:underline"
              @click="goProfile(post.author.userId)"
            >
              프로필 보기 →
            </button>
          </div>
        </div>

        <div class="p-4 space-y-4">
          <div class="text-sm text-foreground whitespace-pre-line">
            {{ post?.content }}
          </div>

          <div class="flex items-center gap-2">
            <button
              class="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition"
              @click="toggleLike"
              :aria-label="post?.liked ? '좋아요 취소' : '좋아요'"
            >
              <span v-if="post?.liked">❤️ 좋아요 취소</span>
              <span v-else>♡ 좋아요</span>
            </button>
            <span class="text-xs text-muted-foreground">댓글 {{ post?.commentCount }} · 좋아요 {{ post?.likeCount }}</span>
          </div>
        </div>
      </div>

      <div class="border border-border rounded-md bg-card p-4">
        <CommentListView :boardId="boardId" :postId="postId" />
      </div>
    </div>
  </Layout>
</template>

<script>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/post.store'
import { storeToRefs } from 'pinia'
import Layout from '@/components/Layout.vue'
import CommentListView from '@/views/comments/CommentListView.vue'
import { useAuthStore } from '../../stores/auth'
import { watch, ref } from 'vue'

export default {
  components: {
    CommentListView,
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
    const route = useRoute()
    const postStore = usePostStore()
    const authStore = useAuthStore()
    const { post, loading } = storeToRefs(postStore)
    const profileTarget = ref(null)

    // 게시글 상세 조회
    onMounted(() => {
      postStore.loadPostDetail(props.boardId, props.postId)
    })

    // 목록으로 이동
    const goList = () => {
      router.push({
        name: 'boardPosts',
        params: {
          boardId: props.boardId,
        },
      })
    }

    const goEdit = () => {
      router.push({
        name: 'postEdit',
        params: {
          boardId: props.boardId,
          postId: props.postId,
        },
      })
    }

    // 없어도 수정 내용 잘 출력됨
    // watch(
    //   ()=>props.postId,
    //   ()=>{
    //     postStore.loadPostDetail(props.boardId, props.postId)
    //   },
    //   {immediate: true}
    // )

    const handleDelete = async () => {
      if (!confirm('게시글을 삭제하시겠습니까?')) return

      await postStore.removePost(props.boardId, props.postId)

      // 삭제 후 게시판 목록으로 이동
      router.push({
        name: 'boardPosts',
        params: { boardId: props.boardId, },
      })
    }

    // 좋아요 토글
    const toggleLike = async ()=>{
      await postStore.toggleLike(props.boardId, props.postId)
      console.log('좋아요 클릭')
    }

    const toggleProfile = (userId) => {
      profileTarget.value = profileTarget.value === userId ? null : userId
    }

    const goProfile = (userId) => {
      if (!userId) return
      router.push({
        name: 'UserProfileParam',
        params: { userId },
      })
    }

    return {
      post,
      loading,
      goList, goEdit, authStore, handleDelete, toggleLike,
      profileTarget, toggleProfile, goProfile,
    }
  },
}
</script>

<style scoped>
</style>
