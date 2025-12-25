<template>
  <Layout>
    <div class="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader :title="'챌린지'" description="챌린지 정보를 확인하세요." />

      <div v-if="loading" class="rounded-md border border-border bg-white p-6 text-sm text-muted-foreground">
        불러오는 중입니다...
      </div>

      <div v-else-if="challenge" class="space-y-4">
        <!-- 챌린지 정보 -->
        <div class="rounded-md border border-border bg-white shadow-sm divide-y divide-border">
          <div class="p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground">
                  {{ statusLabel }}
                </span>
                <span
                  v-if="challenge.joined"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground"
                >
                  참여 중
                </span>
              </div>


              <div class="flex flex-wrap gap-2 justify-end">
                <UiButton
                  v-if="canJoin"
                  :disabled="joining"
                  class="h-9 px-4 text-sm"
                  @click="handleJoin"
                >
                  챌린지 참여
                </UiButton>

                <UiButton
                  v-if="canCancel"
                  variant="outline"
                  :disabled="joining"
                  class="h-9 px-4 text-sm"
                  @click="handleCancel"
                >
                  참여 취소
                </UiButton>

                <p v-if="!canJoin && !canCancel && !isCreator" class="text-sm text-muted-foreground">
                  {{ cannotJoinMessage }}
                </p>

                <UiButton
                  v-if="isCreator"
                  variant="ghost"
                  class="h-9 px-3 text-sm"
                  @click="goEdit"
                >
                  수정
                </UiButton>
                <UiButton
                  v-if="canDelete"
                  variant="destructive"
                  class="h-9 px-3 text-sm"
                  @click="handleDelete"
                >
                  삭제
                </UiButton>
              </div>
            </div>
            <h1 class="text-lg font-semibold text-foreground">{{ challenge?.title || '챌린지' }}</h1>
            <p class="text-sm text-muted-foreground whitespace-pre-line">
              {{ challenge.description || '설명이 없습니다.' }}
            </p>

            <div class="flex-col gap-3 text-sm text-foreground">
              <div class="flex items-center gap-2">
                <span class="font-semibold">기간</span>
                <span class="text-muted-foreground">{{ challenge.startDate }} ~ {{ challenge.endDate }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">참여자</span>
                <span class="text-muted-foreground">{{ challenge.participantCount }}명</span>
              </div>
            </div>

            <div class="space-y-2">
              <template v-if="showCountdown">
                <div class="flex items-center gap-2 text-sm text-foreground">
                  <span class="font-semibold">시작까지 {{ countdownText }}</span>
                </div>
              </template>
              <template v-else>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary"
                    :style="{ width: `${challengeProgress}%` }"
                  />
                </div>
                <div class="flex items-center justify-between text-sm text-foreground">
                  <span class="font-semibold">전체 진행률</span>
                  <span class="font-semibold">{{ challengeProgress }}%</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 참여자 목록 -->
        <div class="rounded-md border border-border bg-white shadow-sm">
          <div class="p-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground">참여자</h2>
            <span class="text-sm text-muted-foreground">총 {{ safeParticipants.length }}명</span>
          </div>

          <p v-if="safeParticipants.length === 0" class="px-4 pb-4 text-sm text-muted-foreground">
            아직 참여자가 없습니다.
          </p>

          <ul v-else class="divide-y divide-border">
            <li
              v-for="p in safeParticipants"
              :key="p.userId"
              class="px-4 py-3 flex justify-between items-center gap-4"
            >
              <div class="flex-1">
                <p class="font-medium text-foreground">{{ p.nickname }}</p>
                <p class="text-xs text-muted-foreground">참여일 {{ formatDate(p.joinedAt) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <UiButton
                  v-if="p.userId !== authStore.userId"
                  variant="outline"
                  class="h-8 px-3 text-xs"
                  @click="goProfile(p.userId)"
                >
                  프로필 보기
                </UiButton>
              </div>
            </li>
          </ul>
        </div>

        <!-- 채팅 -->
        <div class="rounded-md border border-border bg-white shadow-sm p-4">
          <h2 class="text-lg font-semibold text-foreground mb-3">채팅</h2>
          <div v-if="canViewChat">
            <ChallengeChatView :challenge-id="challengeId" />
          </div>
          <div
            v-else
            class="rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground text-center"
          >
            이 챌린지에 참여한 사용자만 채팅을 확인할 수 있습니다.
          </div>
        </div>

        <div class="flex items-center gap-2 justify-end">
          <UiButton variant="outline" class="h-9 px-3 text-sm" @click="goBack">목록으로</UiButton>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge.store'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'
import UiButton from '@/components/ui/Button.vue'
import ChallengeChatView from './ChallengeChatView.vue'

export default {
  components: { Layout, PageHeader, UiButton, ChallengeChatView },

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
    const safeParticipants = computed(() =>
      (participants.value || []).filter((p) => String(p.status || '').toUpperCase() !== 'FAILED')
    )
    const router = useRouter()
    const route = useRoute()

    const routeChallengeId = computed(() => Number(route.params.challengeId || props.challengeId))

    onMounted(async () => {
      await challengeStore.loadChallengeDetail(routeChallengeId.value)
      await challengeStore.loadChallengeParticipants(routeChallengeId.value)
    })

    const goBack = () => {
      router.push({ name: 'challengeList' })
    }

    const isCreator = computed(() => challenge.value?.userId === authStore.userId)
    const isAdmin = computed(() => String(authStore.role || '').toUpperCase() === 'ADMIN')

    const canJoin = computed(() => {
      if (!challenge.value) return false
      if (isCreator.value) return false
      return !challenge.value.joined && challenge.value.status === 'UPCOMING'
    })

    const canCancel = computed(() => {
      if (!challenge.value) return false
      if (isCreator.value) return false
      return challenge.value.joined && ['UPCOMING', 'ACTIVE'].includes(challenge.value.status)
    })

    const handleJoin = async () => {
      if (!challenge.value) return
      try {
        await challengeStore.joinChallenge(challenge.value.challengeId)
        await challengeStore.loadChallengeParticipants(routeChallengeId.value)
      } catch (e) {
        alert(e?.response?.data?.message || '챌린지 참여에 실패했습니다.')
      }
    }

    const handleCancel = async () => {
      if (!challenge.value) return
      if (challenge.value.status === 'ACTIVE') {
        const ok = confirm('진행 중인 챌린지를 취소하면 재참여가 어려울 수 있습니다. 취소하시겠습니까?')
        if (!ok) return
      }
      await challengeStore.cancelChallenge(challenge.value.challengeId)
      await challengeStore.loadChallengeParticipants(routeChallengeId.value)
    }

    const goEdit = () => {
      if (!challenge.value) return
      router.push({
        name: 'challengeEdit',
        params: { challengeId: challenge.value.challengeId },
      })
    }

    const canDelete = computed(() => {
      if (!challenge.value) return false
      return isCreator.value && challenge.value.status === 'UPCOMING'
    })

    const handleDelete = async () => {
      if (!challenge.value) return
      const ok = confirm('이 챌린지를 삭제하시겠습니까?')
      if (!ok) return
      await challengeStore.deleteChallenge(routeChallengeId.value)
      router.replace({ name: 'challengeList' })
    }

    const goProfile = (userId) => {
      if (!userId) return
      router.push({ name: 'UserProfileParam', params: { userId } })
    }

    const cannotJoinMessage = computed(() => {
      if (!challenge.value) return ''
      if (isCreator.value) return '내가 만든 챌린지는 참여할 수 없습니다.'
      if (challenge.value.status === 'ENDED') return '종료된 챌린지입니다.'
      if (challenge.value.status === 'CLOSED') return '마감된 챌린지입니다.'
      if (challenge.value.status === 'ACTIVE' && !challenge.value.joined) {
        return '진행 중인 챌린지입니다.'
      }
      return '참여가 불가능한 챌린지입니다.'
    })

    const canViewChat = computed(() => {
      if (!challenge.value) return false
      return !!(challenge.value.joined || isCreator.value || isAdmin.value)
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

    const clampPercent = (value) => {
      const n = Number.isFinite(value) ? value : 0
      return Math.min(100, Math.max(0, Math.round(n)))
    }

    const challengeProgress = computed(() => {
      const startStr = challenge.value?.startDate
      const endStr = challenge.value?.endDate
      if (!startStr || !endStr) return 0

      const start = new Date(startStr)
      const end = new Date(endStr)
      const today = new Date()
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

      const totalMs = end.getTime() - start.getTime()
      if (totalMs <= 0) {
        return today.getTime() >= start.getTime() ? 100 : 0
      }

      const elapsed = today.getTime() - start.getTime()
      return clampPercent((elapsed / totalMs) * 100)
    })

    const showCountdown = computed(() => {
      if (!challenge.value) return false
      if (challenge.value.status !== 'UPCOMING') return false
      const start = new Date(challenge.value.startDate)
      return Number.isFinite(start.getTime()) && start.getTime() > Date.now()
    })

    const countdownText = computed(() => {
      if (!showCountdown.value) return ''
      const start = new Date(challenge.value.startDate)
      const diffMs = start.getTime() - Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      const days = Math.max(0, Math.ceil(diffMs / dayMs))
      return days > 0 ? `${days}일` : '오늘 시작'
    })

    const formatDate = (value) => {
      if (!value) return ''
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return value
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }

    return {
      challengeId: routeChallengeId,
      challenge,
      loading,
      joining,
      authStore,
      safeParticipants,
      challengeProgress,
      showCountdown,
      countdownText,
      formatDate,
      canJoin,
      canCancel,
      canViewChat,
      handleJoin,
      handleCancel,
      goEdit,
      goBack,
      goProfile,
      isCreator,
      isAdmin,
      canDelete,
      handleDelete,
      cannotJoinMessage,
      statusLabel,
    }
  },
}
</script>
