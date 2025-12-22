import { defineStore } from 'pinia'
import { fetchPostsByBoard } from '@/services/board.service'

export const useBoardStore = defineStore('board', {
  state: () => ({
    posts: [],
    loading: false,
    page: 0,
    size: 20, // 무한스크롤 청크 크기
    totalPages: 0,
    totalElements: 0,
    hasNext: true,
    sort: 'latest',
    currentBoardId: null,
  }),

  actions: {
    resetState(sort = 'latest') {
      this.posts = []
      this.page = 0
      this.totalPages = 0
      this.totalElements = 0
      this.hasNext = true
      this.sort = sort
    },

    async loadBoardPosts(boardId, { append = false, sort } = {}) {
      if (this.loading) return

      // 보드나 정렬이 바뀌면 초기화 후 처음부터
      const sortToUse = sort || this.sort || 'latest'
      if (!append && (this.currentBoardId !== boardId || this.sort !== sortToUse)) {
        this.resetState(sortToUse)
        this.currentBoardId = boardId
      }

      // 추가 로드인데 더 없으면 중단
      if (append && !this.hasNext) return

      const nextPage = append ? this.page + 1 : 0
      this.loading = true
      try {
        const response = await fetchPostsByBoard(boardId, {
          page: nextPage,
          size: this.size,
          sort: sortToUse,
        })
        const data = response.data

        if (append) this.posts.push(...data.content)
        else this.posts = data.content

        this.page = data.page
        this.totalPages = data.totalPages
        this.totalElements = data.totalElements
        this.hasNext = this.page < this.totalPages - 1
        this.sort = sortToUse
      } catch (error) {
        console.error('게시글 목록 조회 실패', error)
        this.hasNext = false
      } finally {
        this.loading = false
      }
    },
  },
})
