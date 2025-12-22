import { defineStore } from 'pinia'
import { fetchChallengeList, fetchChallengeDetail, challengeJoin, challengeCancel,
    createChallenge, updateChallenge, deleteChallenge, } from '@/services/challenge.service'

export const useChallengeStore = defineStore('challenge', {
  state: () => ({
    challenges: [],
    challengeDetail: null,
    loading: false,
    joining: false,
    creating: false,
    updating: false,
    deleting: false,
  }),

  actions: {
    async loadChallenges() {
      this.loading = true
      this.challengeDetail = null
      try {
        const res = await fetchChallengeList()
        this.challenges = res.data.items
        console.log('이름확인하기', this.challenges)
      } catch (e) {
        console.error('챌린지 목록 조회 실패', e)
      } finally {
        this.loading = false
      }
    },

    async loadChallengeDetail(challengeId) {
      this.loading = true
      this.challengeDetail = null
      try {
        const res = await fetchChallengeDetail(challengeId)
        this.challengeDetail = res.data
      } finally {
        this.loading = false
      }
    },

    async joinChallenge(challengeId) {
      try {
        await challengeJoin(challengeId)
        await this.loadChallengeDetail(challengeId)
      } catch (e) {
        throw e   // ⭐ 이게 핵심
      }
    },


    async cancelChallenge(challengeId) {
      if (this.joining) return
      this.joining = true
      try {
        await challengeCancel(challengeId)
        await this.loadChallengeDetail(challengeId)
      } catch (e) {
        console.error('챌린지 취소 실패', e)
      } finally {
        this.joining = false
      }
    },


    // 챌린지 생성
    async createChallenge(payload) {
      this.creating = true
      try {
        const res = await createChallenge(payload)
        return res.data.challengeId // 생성된 ID 반환
      } catch (e) {
        console.error('챌린지 생성 실패', e)
        throw e
      } finally {
        this.creating = false
      }
    },
    // 챌린지 수정
    async updateChallenge(challengeId, payload) {
      this.updating = true
      try {
        const res = await updateChallenge(challengeId, payload)
        this.challengeDetail = res.data // 수정된 정보로 갱신
        return res.data
      } catch (e) {
        console.error('챌린지 수정 실패', e)
        throw e
      } finally {
        this.updating = false
      }
    },
    // 챌린지 삭제
    async deleteChallenge(challengeId) {
      this.deleting = true
      try {
        await deleteChallenge(challengeId)
        this.challengeDetail = null
      } catch (e) {
        console.error('챌린지 삭제 실패', e)
        throw e
      } finally {
        this.deleting = false
      }
    },


  },
})
