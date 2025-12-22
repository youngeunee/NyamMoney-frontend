<template>
  <Layout>
    <div>
      <h1 class="text-2xl font-bold mb-6">챌린지 리스트</h1>

      <!-- 헤더 영역 -->
      <div class="flex justify-between items-center mb-6 gap-3">
        <button
          @click="goCreate"
          class="inline-flex items-center
                 px-3 py-1.5
                 text-sm font-medium
                 rounded-full
                 border border-red-500
                 bg-yummoney-primary text-black
                 hover:bg-yummoney-primaryHover
                 transition">
          + 챌린지 생성
        </button>

        <div class="ml-auto flex gap-2">
          <button
            @click="toggleActiveOnly"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition-colors',
              showActiveOnly
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            ]"
            type="button"
          >
            진행중만 보기
          </button>
          <button
            @click="toggleUpcomingOnly"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition-colors',
              showUpcomingOnly
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            ]"
            type="button"
          >
            진행 예정만 보기
          </button>
        </div>
      </div>
  
      <!-- 로딩 -->
      <p v-if="loading">불러오는 중...</p>
  
      <!-- 컨텐츠 -->
     <div v-if="!loading"
     class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

  <div
    v-for="c in visibleChallenges"
    :key="c.challengeId"
    class="rounded-xl border bg-white p-5 shadow-sm
           hover:-translate-y-1 transition cursor-pointer"
    :class="statusStyleMap[c.status]?.border"
    @click="goDetail(c.challengeId)"
  >

    <!-- 🔹 상단 뱃지 영역 -->
    <div class="flex items-center gap-2 mb-2">
      <!-- 상태 뱃지 -->
      <span
        class="px-2 py-1 text-xs font-medium rounded-full"
        :class="statusStyleMap[c.status]?.badge"
      >
        {{ statusStyleMap[c.status]?.label }}
      </span>

      <!-- 참여 여부 뱃지 (참여한 경우만) -->
      <span
        v-if="c.joined"
        class="px-2 py-1 text-xs font-medium rounded-full
               bg-green-100 text-green-700"
      >
        참여 중
      </span>
    </div>

    <!-- 제목 -->
    <h2 class="font-semibold text-lg mb-2">
      {{ c.title }}
    </h2>

    <!-- 설명 -->
    <p class="text-sm text-gray-600 mb-4 line-clamp-2">
      {{ c.description }}
    </p>

    <!-- 기간 -->
    <p class="text-xs text-gray-500 mb-2">
      {{ c.startDate }} ~ {{ c.endDate }}
    </p>

    <!-- 하단 -->
    <div class="flex justify-between items-center mt-4">
      <span class="text-sm text-gray-500">
        참여자 {{ c.participantCount ?? 0 }}명
      </span>
    </div>

  </div>
</div>

<div ref="sentinel" class="h-10"></div>

</div>

        
  </Layout>
</template>

<script>
import { onMounted, onBeforeUnmount, computed, ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge.store'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const challengeStore = useChallengeStore()
    const { challenges, loading } = storeToRefs(challengeStore)
    const showActiveOnly = ref(false)
    const showUpcomingOnly = ref(false)
    const page = ref(0)
    const size = ref(12)
    const sentinel = ref(null)
    let observer = null

    const statusStyleMap = {
      UPCOMING: {
        badge: 'bg-blue-100 text-blue-700',
        border: 'hover:border-blue-400',
        label: '곧 시작',
      },
      ACTIVE: {
        badge: 'bg-green-100 text-green-700',
        border: 'hover:border-green-500',
        label: '진행 중',
      },
      ENDED: {
        badge: 'bg-gray-100 text-gray-500',
        border: 'hover:border-gray-300',
        label: '종료됨',
      },
      CLOSED: {
        badge: 'bg-gray-100 text-gray-500',
        border: 'border-gray-200',
        label: '취소됨',
      },
    }

    const filteredChallenges = computed(() => {
      // 둘 다 켜지면 ACTIVE, UPCOMING 모두 허용
      if (showActiveOnly.value && showUpcomingOnly.value) {
        return challenges.value.filter((c) =>
          c.status === 'ACTIVE' || c.status === 'UPCOMING'
        )
      }
      if (showActiveOnly.value) {
        return challenges.value.filter((c) => c.status === 'ACTIVE')
      }
      if (showUpcomingOnly.value) {
        return challenges.value.filter((c) => c.status === 'UPCOMING')
      }
      return challenges.value
    })

    const visibleChallenges = computed(() =>
      filteredChallenges.value.slice(0, (page.value + 1) * size.value)
    )

    const loadInitial = async () => {
      if (!challenges.value.length) {
        await challengeStore.loadChallenges()
      }
      page.value = 0
      await nextTick()
    }

    const loadMore = () => {
      const total = filteredChallenges.value.length
      const canLoad = (page.value + 1) * size.value < total
      if (canLoad) page.value += 1
    }

    const tryLoadMoreIfVisible = () => {
      if (!sentinel.value || loading.value) return
      const rect = sentinel.value.getBoundingClientRect()
      const inView = rect.top <= window.innerHeight + 160
      if (inView) loadMore()
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
        { root: null, rootMargin: '160px', threshold: 0 }
      )
      observer.observe(sentinel.value)

      // 초기 로드 완료 후 바로 보이는 경우 처리
      tryLoadMoreIfVisible()
    }

    onMounted(async () => {
      await loadInitial()
      await setupObserver()
    })

    onBeforeUnmount(() => {
      if (observer && sentinel.value) observer.unobserve(sentinel.value)
      observer = null
    })

    watch(challenges, async () => {
      page.value = 0
      await nextTick()
      tryLoadMoreIfVisible()
    })

    watch(showActiveOnly, async () => {
      page.value = 0
      await nextTick()
      tryLoadMoreIfVisible()
    })

    watch(showUpcomingOnly, async () => {
      page.value = 0
      await nextTick()
      tryLoadMoreIfVisible()
    })

    watch(
      () => loading.value,
      (isLoading) => {
        if (!isLoading) {
          tryLoadMoreIfVisible()
        }
      }
    )

    const goDetail = (challengeId) => {
      router.push({
        name: 'challengeDetail',
        params: { challengeId },
      })
    }

    const goCreate = () => {
      router.push({ name: 'challengeCreate' })
    }

    const toggleActiveOnly = () => {
      showActiveOnly.value = !showActiveOnly.value
    }
    const toggleUpcomingOnly = () => {
      showUpcomingOnly.value = !showUpcomingOnly.value
    }

    return {
      loading,
      statusStyleMap,
      goDetail,
      goCreate,
      visibleChallenges,
      toggleActiveOnly,
      toggleUpcomingOnly,
      showActiveOnly,
      showUpcomingOnly,
      sentinel,
    }
  },
}
</script>
