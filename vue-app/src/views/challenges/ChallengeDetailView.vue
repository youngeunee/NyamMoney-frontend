<template>
  <Layout>
    <div class="p-8 max-w-3xl mx-auto">
      <button
        class="mb-6 text-sm text-gray-500 hover:underline"
        @click="goBack">← 목록으로
      </button>

      <p v-if="loading">불러오는 중...</p>

    <div v-else-if="challenge" class="rounded-xl border p-6 bg-white">
        <!-- 버튼 영역 -->
    <!-- 버튼 영역 -->
<div class="mt-4 flex gap-2">

  <!-- ✅ 생성자 전용 안내 -->
  <p
    v-if="isCreator"
    class="text-sm text-gray-500"
  >
    내가 만든 챌린지입니다
  </p>

  <!-- ✅ 생성자가 아닐 때만 참여 UI 판단 -->
  <template v-else>
    <!-- 참여하기 -->
    <button
      v-if="canJoin"
      :disabled="joining"
      @click="handleJoin"
      class="px-4 py-2 rounded bg-orange-400 hover:bg-orange-500 text-white"
    >
      챌린지 참여
    </button>

    <!-- 참여취소 -->
    <button
      v-if="canCancel"
      :disabled="joining"
      @click="handleCancel"
      class="px-4 py-2 rounded border border-red-400 text-red-500 hover:bg-red-50"
    >
      참여 취소
    </button>

    <!-- 참여 불가 상태 -->
    <p
      v-if="!canJoin && !canCancel && !isCreator"
      class="text-sm text-gray-400"
    >
      {{ cannotJoinMessage }}
    </p>

  </template>

</div>


        <h1 class="text-2xl font-bold mb-2">
          {{ challenge.title }}
        </h1>

        <p class="text-gray-600 mb-4">
          {{ challenge.description }}
        </p>

        <p class="text-sm text-gray-500 mb-2">
          기간: {{ challenge.startDate }} ~ {{ challenge.endDate }}
        </p>

        <p class="text-sm mb-4">
          참여자 {{ challenge.participantCount }}명
        </p>

        <span
          v-if="challenge.joined"
          class="inline-block px-3 py-1 text-sm rounded-full
                 bg-green-100 text-green-700"
        >
          참여 중
        </span>
      </div>
    <button
        v-if="isCreator"
        @click="goEdit"
        class="text-sm text-gray-400"
        >
        수정
      </button>
      <button
        v-if="canDelete"
        @click="handleDelete"
        class="text-sm text-red-500 hover:text-red-600"
      >
        삭제
      </button>
  
      <!-- 참여자 목록 -->
    <div class="mt-10">
      <h2 class="text-lg font-semibold mb-4">
        챌린지 참여자
      </h2>
      
      <p v-if="safeParticipants.length === 0" class="text-sm text-gray-400">
        아직 참여자가 없습니다.
      </p>
      
      <ul v-else class="space-y-3">
        <li
          v-for="p in safeParticipants"
          :key="p.userId"
          class="flex justify-between items-center border rounded-lg px-4 py-3"
        >
          <div>
            <p class="font-medium">{{ p.nickname }}</p>
            <p class="text-xs text-gray-400">
              참여일 {{ p.joinedAt }}
            </p>
          </div>
      
          <div class="text-right">
            <p class="text-sm">
              진행률 {{ Math.round(p.progress * 100) }}%
            </p>
            <p class="text-xs text-gray-500">
              {{ p.status }}
            </p>
          </div>
        </li>
      </ul>
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
import { useAuthStore } from '../../stores/auth'

export default {
  components: { Layout },

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
      router.push({ name: 'Projects'})
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
      router.replace({ name: 'Projects' })
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




    return {
      challenge, loading, goBack,
      canJoin, canCancel, handleJoin, handleCancel, joining,
      goEdit, isCreator,
      canDelete, handleDelete,
      cannotJoinMessage,
      safeParticipants,
    }
  },
}
</script>
