<template>
  <Layout>
    <div class="p-6 space-y-6">
      <PageHeader title="챌린지" description="진행 중/예정 챌린지를 확인하세요." />

      <div class="flex flex-wrap items-center gap-3">
        <button
          @click="goCreate"
          class="inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition"
          type="button"
        >
        챌린지 생성
        </button>

        <div class="ml-auto flex gap-2">
          <button
            @click="toggleActiveOnly"
            :class="[
              'px-3 py-1.5 text-sm rounded-md border border-border transition-colors hover:bg-accent',
              showActiveOnly
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary'
                : 'bg-card text-foreground'
            ]"
            type="button"
          >
            진행
          </button>
          <button
            @click="toggleUpcomingOnly"
            :class="[
              'px-3 py-1.5 text-sm rounded-md border border-border transition-colors hover:bg-accent',
              showUpcomingOnly
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary'
                : 'bg-card text-foreground'
            ]"
            type="button"
          >
            대기
          </button>
        </div>
      </div>

      <div v-if="loading" class="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        불러오는 중...
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="c in visibleChallenges"
          :key="c.challengeId"
          class="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent/60 cursor-pointer"
          @click="goDetail(c.challengeId)"
        >
          <div class="flex items-center gap-2 mb-3">
            <span
              class="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground"
            >
              {{ statusStyleMap[c.status]?.label || '진행 상태' }}
            </span>
            <span
              v-if="c.joined"
              class="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground"
            >
              참여 중
            </span>
          </div>

          <h2 class="font-semibold text-lg mb-2 text-foreground line-clamp-2">
            {{ c.title }}
          </h2>
          <p class="text-sm text-muted-foreground mb-4 line-clamp-2">
            {{ c.description }}
          </p>

          <div class="space-y-1 text-sm text-muted-foreground">
            <p>기간 {{ c.startDate }} ~ {{ c.endDate }}</p>
            <p>참여자 {{ c.participantCount ?? 0 }}명</p>
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
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  components: { Layout, PageHeader },
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
      UPCOMING: { label: '대기' },
      ACTIVE: { label: '진행' },
      ENDED: { label: '종료' },
      CLOSED: { label: '종료' },
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
