<template>
  <Layout>
    <div class="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader
        :title="challenge?.title || '챌린지 상세'"
        description="챌린지 정보를 확인하세요."
      />

      <button
        class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        @click="goBack"
        type="button"
      >
        ← 목록으로
      </button>

      <div v-if="loading" class="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        불러오는 중...
      </div>

      <div v-else-if="challenge" class="space-y-6">
        <div class="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">
              {{ statusLabel }}
            </span>
            <span
              v-if="challenge.joined"
              class="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground"
            >
              참여 중
            </span>
            <span
              v-if="isCreator"
              class="px-2 py-1 text-xs font-medium rounded-full bg-accent text-foreground"
            >
              내가 만든 챌린지
            </span>
          </div>

          <p class="text-muted-foreground whitespace-pre-line">
            {{ challenge.description || '설명이 없습니다.' }}
          </p>

          <div class="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <span class="font-medium text-foreground">기간</span>
              <span>{{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-foreground">참여자</span>
              <span>{{ challenge.participantCount }}명</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <button
              v-if="canJoin"
              :disabled="joining"
              @click="handleJoin"
              class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              type="button"
            >
              챌린지 참여
            </button>

            <button
              v-if="canCancel"
              :disabled="joining"
              @click="handleCancel"
              class="px-4 py-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground hover:bg-accent transition disabled:opacity-50"
              type="button"
            >
              참여 취소
            </button>

            <p
              v-if="!canJoin && !canCancel && !isCreator"
              class="text-sm text-muted-foreground"
            >
              {{ cannotJoinMessage }}
            </p>

            <button
              v-if="isCreator"
              @click="goEdit"
              class="px-3 py-2 rounded-md border border-border text-sm font-semibold text-foreground hover:bg-accent transition"
              type="button"
            >
              수정
            </button>
            <button
              v-if="canDelete"
              @click="handleDelete"
              class="px-3 py-2 rounded-md border border-border text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
              type="button"
            >
              삭제
            </button>
          </div>
        </div>

        <div class="p-8 max-w-3xl mx-auto">
        <!-- 기존 챌린지 정보 -->

        <!-- 채팅 -->
        <ChallengeChatView
          v-if="true"
          :challenge-id="8"
          class="mt-8"
        />
      </div>

        <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-foreground">챌린지 참여자</h2>
            <span class="text-sm text-muted-foreground">총 {{ safeParticipants.length }}명</span>
          </div>

          <p v-if="safeParticipants.length === 0" class="text-sm text-muted-foreground">
            아직 참여자가 없습니다.
          </p>

          <ul v-else class="divide-y divide-border">
            <li
              v-for="p in safeParticipants"
              :key="p.userId"
              class="flex justify-between items-center py-3"
            >
              <div>
                <p class="font-medium text-foreground">{{ p.nickname }}</p>
                <p class="text-xs text-muted-foreground">
                  참여일 {{ p.joinedAt }}
                </p>
              </div>

              <div class="text-right text-sm text-muted-foreground space-y-1">
                <p class="font-medium text-foreground">
                  진행률 {{ Math.round(p.progress * 100) }}%
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ p.status }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute, } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge.store'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import ChallengeChatView from './ChallengeChatView.vue'

export default {
  components: { Layout, PageHeader, ChallengeChatView, },

  props: {
    challengeId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const challengeStore = useChallengeStore()
    const authStore = useAuthStore()
    const { challengeDetail: challenge, loading, joining, participants } = storeToRefs(challengeStore)
    const safeParticipants = computed(() => participants.value || [])
    const router = useRouter()
    const route = useRoute()

    const challengeId = computed(() => Number(route.params.challengeId))

    onMounted(async() => {
      await challengeStore.loadChallengeDetail(challengeId.value)
      await challengeStore.loadChallengeParticipants(challengeId.value)
    })

    const goBack = () => {
      router.push({ name: 'challengeList'})
    }

    const canJoin = computed(() => {
      if (!challenge.value) return false
      if (isCreator.value) return false   // 생성자 차단

      return (
        !challenge.value.joined &&
        ['UPCOMING', 'ACTIVE'].includes(challenge.value.status)
      )
    })


    const canCancel = computed(() => {
      if (!challenge.value) return false
      if (isCreator.value) return false   // 생성자 차단

      return (
        challenge.value.joined &&
        ['UPCOMING', 'ACTIVE'].includes(challenge.value.status)
      )
    })



    const handleJoin = async () => {
      try {
        await challengeStore.joinChallenge(challenge.value.challengeId)
      } catch (e) {
        alert(e.response?.data?.message || '챌린지 참여에 실패했습니다.')
      }
    }


    const handleCancel = () => {
      if (challenge.value.status === 'ACTIVE') {
        const ok = confirm(
          '진행 중인 챌린지를 취소하면 실패 처리되며 다시 참여할 수 없습니다.\n정말 취소하시겠습니까?'
        )
        if (!ok) return
      }
      challengeStore.cancelChallenge(challenge.value.challengeId)
    }



    const goEdit = () => {
        //const challengeId = challenge.value.challengeId
        router.push({
            name: 'challengeEdit',
            params: { challengeId },
        })
    }
    // 생성한 사람인지 체크
    const isCreator = computed(() => {
        if (!challenge.value) return false
        return challenge.value.userId === authStore.userId
    })

    const canDelete = computed(() => {
      if (!challenge.value) return false
      return (
        isCreator.value &&
        challenge.value.status === 'UPCOMING'
      )
    })

    const handleDelete = async () => {
      //const challengeId = challenge.value.challengeId
      if (!confirm('이 챌린지를 삭제하시겠습니까?\n참여자 전원에게 환불됩니다.')) {
        return
      }

      await challengeStore.deleteChallenge(challengeId.value)

      // 삭제 후 목록으로 이동 (back 아님)
      router.replace({ name: 'challengeList' })
    }

    // 참여 신청 안 되는
    const cannotJoinMessage = computed(() => {
      if (!challenge.value) return ''
      // 생성자는 별도 처리
      if (isCreator.value) {
        return '내가 만든 챌린지입니다.'
      }
      // 이미 종료됨
      if (challenge.value.status === 'ENDED') {
        return '이미 종료된 챌린지입니다.'
      }
      // 삭제(마감)됨
      if (challenge.value.status === 'CLOSED') {
        return '마감된 챌린지입니다.'
      }
      // 진행 중 + 이미 취소(실패)
      if (
        challenge.value.status === 'ACTIVE' &&
        !challenge.value.joined
      ) {
        return '진행 중 취소한 챌린지는 다시 참여할 수 없습니다.'
      }
      return '참여할 수 없는 챌린지입니다.'
    })

    const statusLabel = computed(() => {
      const labelMap = {
        UPCOMING: '대기',
        ACTIVE: '진행',
        ENDED: '종료',
        CLOSED: '종료',
      }
      return labelMap[challenge.value?.status] || '진행 상태'
    })

    return {
      challenge, loading, goBack,
      canJoin, canCancel, handleJoin, handleCancel, joining,
      goEdit, isCreator,
      canDelete, handleDelete,
      cannotJoinMessage,
      safeParticipants,
      statusLabel,
    }
  },
}
</script>
