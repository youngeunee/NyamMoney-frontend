import api from '@/api/axios'

/**
 * 게시판별 게시글 목록 조회
 * @param {number} boardId
 */
export function fetchPostsByBoard(boardId, { page = 0, size = 20, sort = 'latest', keyword = '' } = {}) {
  return api.get(`/v1/boards/${boardId}/posts`, {
    params: { page, size, sort, keyword: keyword || undefined },
  })
}

export function fetchBoards() {
  return api.get('/v1/boards')
}
