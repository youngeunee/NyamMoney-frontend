<template>
  <Layout>
    <div class="p-6 space-y-6">
      <PageHeader title="프로필" description="사용자 프로필을 확인하세요." />
      <div class="max-w-6xl mx-auto space-y-8">

        <!-- ✅ 데스크톱: 2열 + 2행 / 모바일: 자동 세로 -->
        <div class="grid gap-8 lg:grid-cols-[320px_1fr] lg:grid-rows-[auto_1fr] lg:items-stretch">

          <!-- -------------------- LEFT / TOP (프로필 + 통계 + 소개) -------------------- -->
          <div class="space-y-4 order-1 lg:col-start-1 lg:row-start-1">
            <UiCard wrapperClass="border border-border bg-white shadow-sm">
              <div class="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
                <UiAvatar
                  :src="profile.avatarUrl"
                  :alt="profile.nickname"
                  :name="profile.nickname"
                  size="lg"
                  className="border-2 border-border"
                />
                <div>
                  <p class="text-sm text-gray-500">@{{ profile.userId }}</p>
                  <h1 class="text-2xl font-bold leading-tight">{{ profile.nickname }}</h1>
                </div>

                <div class="flex flex-col md:flex-row w-full gap-2 mt-2">
                  <template v-if="isMyProfile">
                    <UiButton
                      class="w-full md:w-auto bg-white text-gray-700 border border-border"
                      variant="outline"
                      @click="goEdit"
                    >
                      내 정보 수정
                    </UiButton>
                  </template>

                  <template v-else>
                    <UiButton
                      class="w-full md:w-auto"
                      :variant="followButtonVariant"
                      :disabled="profile.isBlocked || loadingFollow"
                      @click="toggleFollow"
                    >
                      {{ followButtonLabel }}
                    </UiButton>

                    <UiButton
                      class="w-full md:w-auto bg-gray-100 text-gray-700"
                      variant="outline"
                      :disabled="loadingBlock"
                      @click="toggleBlock"
                    >
                      {{ profile.isBlocked ? '차단 해제' : '차단' }}
                    </UiButton>
                  </template>
                </div>
              </div>
            </UiCard>

            <UiCard wrapperClass="border border-border bg-white shadow-sm">
              <div class="space-y-3">
                <p class="text-sm font-semibold text-gray-600">활동 통계</p>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div v-for="stat in stats" :key="stat.label" class="rounded-md bg-gray-50 py-3">
                    <p class="text-xl font-bold">{{ stat.value }}</p>
                    <p class="text-xs text-gray-500">{{ stat.label }}</p>
                  </div>
                </div>
              </div>
            </UiCard>
          </div>

          <!-- -------------------- RIGHT (Posts) : 데스크톱에서 2행 span -------------------- -->
          <div class="space-y-6 order-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:row-span-2 lg:h-full lg:min-h-0">
            <div class="flex flex-col gap-2">
              <h2 class="text-2xl font-bold">Posts</h2>
              <div class="flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-2">
                  <button
                    v-for="tab in mainTabs"
                    :key="tab.key"
                    @click="switchMainTab(tab.key)"
                    :class="[
                      'px-4 py-1.5 rounded-full text-sm border transition-colors',
                      activeMainTab === tab.key
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    ]"
                    type="button"
                  >
                    {{ tab.label }}
                  </button>
                </div>

              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex flex-wrap gap-2">
                <button
                  v-for="tab in boardTabs"
                  :key="tab.key"
                  @click="switchBoard(tab.key)"
                  :class="[
                    'px-3 py-1 rounded-full text-sm border transition-colors',
                    activeBoard === tab.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                  ]"
                  type="button"
                >
                  {{ tab.label }}
                </button>
              </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-white border border-border text-sm shadow-sm">
                  총 {{ activeMainTab === 'commented' ? totalCommented : totalPosts }}개
                </span>
              </div>

              <div class="border border-border bg-white rounded-lg shadow-sm h-full lg:min-h-0 flex flex-col">
                <div class="p-4 flex items-center justify-between">
                  <p class="text-sm text-gray-500">
                    {{ activeBoard === 'all' ? '전체' : boardTabs.find(t => t.key === activeBoard)?.label }} 게시글
                  </p>
                </div>

                <div
                  ref="postsScrollRoot"
                  class="max-h-[520px] lg:max-h-[640px] overflow-y-auto px-4 pb-4 space-y-3"
                >
                  <UiCard
                    v-for="post in visibleItems"
                    :key="post.id"
                    wrapperClass="border border-border bg-white shadow-sm cursor-pointer"
                    @click="goPostDetail(post)"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-sm text-gray-500">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                            {{ post.boardName }}
                          </span>
                          <span>{{ post.date }}</span>
                        </div>
                        <div class="flex items-center gap-4 text-xs">
                          <span>좋아요 {{ post.likes }}</span>
                          <span>댓글 {{ post.comments }}</span>
                        </div>
                      </div>

                      <h3 class="font-semibold text-lg text-gray-900 line-clamp-1">
                        {{ post.title || '제목 없는 글' }}
                      </h3>
                      <p class="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {{ post.excerpt }}
                      </p>
                    </div>
                  </UiCard>

                  <UiCard v-if="loadingPosts" wrapperClass="border border-dashed border-border bg-white">
                    <div class="text-center text-gray-500 py-6">불러오는 중...</div>
                  </UiCard>

                  <UiCard v-else-if="!filteredPosts.length" wrapperClass="border border-dashed border-border bg-white">
                    <div class="text-center text-gray-500 py-6">이 카테고리에 게시글이 없습니다.</div>
                  </UiCard>

                  <div ref="sentinel" class="h-8"></div>
                </div>
              </div>
            </div>

            <!-- 내가 참여한 챌린지: Posts 아래로 이동 -->
            <div class="space-y-3">
              <div>
                <h2 class="text-2xl font-bold">Challenge</h2>
              </div>
              <UiCard wrapperClass="border border-border bg-white shadow-sm">
                <div class="space-y-3">
                  <div v-if="!myChallenges.length" class="text-sm text-gray-500">
                    참여 중인 챌린지가 없습니다.
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="c in myChallenges"
                      :key="c.challengeId"
                      class="flex items-center justify-between p-3 rounded-lg border border-border bg-gray-50"
                    >
                      <div class="space-y-1">
                        <p class="text-sm font-medium">{{ c.title }}</p>
                        <div class="flex items-center gap-2">
                          <span
                            class="px-2 py-0.5 text-xs rounded-full"
                            :class="statusStyleMap[c.status]?.badge"
                          >
                            {{ statusStyleMap[c.status]?.label }}
                          </span>

                          <span class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            참여 중
                          </span>
                        </div>
                      </div>

                      <button
                        class="text-xs text-primary hover:underline"
                        @click="goChallengeDetail(c.challengeId)"
                      >
                        보기 →
                      </button>
                    </div>
                  </div>
                </div>
              </UiCard>
            </div>
          </div>

          
          
          <!-- -------------------- LEFT / BOTTOM (예산 사용률) -------------------- -->
          <UiCard
            v-if="showBudgetUsage"
            wrapperClass="order-2 border border-border bg-white shadow-sm"
            class="lg:col-start-1 lg:row-start-2"
          >
            <template #header>
              <div class="px-4 pt-4 flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">이번 달 예산 사용률</p>
                  <p class="text-sm font-semibold text-foreground">소비 & 냠 비용</p>
                </div>
                <div v-if="summaryLoading" class="text-xs text-muted-foreground flex items-center gap-2">
                  <UiSpinner /> 불러오는 중
                </div>
              </div>
            </template>

            <div v-if="!summaryLoading" class="p-4 space-y-6">
              <div class="space-y-3">
                <p class="text-sm font-semibold text-foreground text-center">냠 비용 비율</p>
                <div class="flex items-center justify-center gap-4">
                  <div class="relative inline-block donut-wrapper">
                    <svg viewBox="0 0 36 36" class="h-44 w-44">
                      <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="#fed253"
                        stroke-width="6"
                        stroke-linecap="butt"
                        :stroke-dasharray="`${impulseUsageCap} ${100 - impulseUsageCap}`"
                        stroke-dashoffset="25"
                      />
                      <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                      <text x="18" y="19" text-anchor="middle" class="fill-current text-foreground" font-size="6" font-weight="700" dominant-baseline="middle">
                        {{ Math.round(impulseUsage) }}%
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <p class="text-sm font-semibold text-foreground text-center">예산 사용률</p>
                <div class="flex items-center justify-center gap-4">
                  <div class="relative inline-block donut-wrapper">
                    <svg viewBox="0 0 36 36" class="h-44 w-44">
                      <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="#fed253"
                        stroke-width="6"
                        stroke-linecap="butt"
                        :stroke-dasharray="`${expenseUsageCap} ${100 - expenseUsageCap}`"
                        stroke-dashoffset="25"
                      />
                      <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                      <text x="18" y="19" text-anchor="middle" class="fill-current text-foreground" font-size="6" font-weight="700" dominant-baseline="middle">
                        {{ Math.round(expenseUsage) }}%
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="p-4 text-sm text-muted-foreground text-center">
              데이터를 불러오는 중입니다.
            </div>
          </UiCard>



        </div>
      </div>
    </div>
  </Layout>
</template>


<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'
import UiAvatar from '@/components/ui/Avatar.vue'
import UiButton from '@/components/ui/Button.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import { useAuthStore } from '@/stores/auth'

import { fetchUser, fetchUserPosts, fetchUserComments, fetchMe } from '@/services/user.service'
import {
  requestFollow,
  unfollow,
  cancelFollowRequest,
  fetchFollowStatus,
  block,
  unblock,
  fetchFollowers,
  fetchFollowings,
} from '@/services/follow.service'
import { fetchBoards } from '@/services/board.service'
import { fetchTransactionSummary, fetchUserTransactionSummary } from '@/services/transaction.service'
import { fetchTransactionDailySummary } from '@/services/transaction.service'

// 참여 중인 챌린지 출력 ------------------------------------------ 챌린지
import { useChallengeStore } from '@/stores/challenge.store'
const challengeStore = useChallengeStore()
const { challenges } = storeToRefs(challengeStore)
const myChallenges = computed(() =>
  challenges.value.filter((c) => c.joined)
)
const statusStyleMap = {
  UPCOMING: {
    badge: 'bg-blue-100 text-blue-700',
    label: '곧 시작',
  },
  ACTIVE: {
    badge: 'bg-green-100 text-green-700',
    label: '진행 중',
  },
  ENDED: {
    badge: 'bg-gray-100 text-gray-500',
    label: '종료됨',
  },
  CLOSED: {
    badge: 'bg-gray-100 text-gray-500',
    label: '취소됨',
  },
}
const goChallengeDetail = (challengeId) => {
  router.push({
    name: 'challengeDetail',
    params: { challengeId },
  })
}
// --------------- 여기까지 챌린지 --------------------

const toStr = (v) => (v === null || v === undefined ? '' : String(v))
const formatCurrency = (value) => (value ?? 0).toLocaleString('ko-KR')
// -------------------- state --------------------
const profile = reactive({
  nickname: '',
  userId: '',
  avatarUrl: '',
  bio: '',
  location: '',
  joinedDate: '',
  followStatus: 'NONE', // 'NONE' | 'PENDING' | 'ACCEPTED'
  followRequestId: '',
  isBlocked: false
})

const auth = useAuthStore()
const { userId: myUserId } = storeToRefs(auth)
const route = useRoute()
const router = useRouter()

const targetUserId = computed(() => {
  const fromParams = route.params.userId
  const fromQuery = route.query.userId
  const own = myUserId.value ? String(myUserId.value) : ''
  return (fromParams ? String(fromParams) : '') || (fromQuery ? String(fromQuery) : '') || own || profile.userId
})

const isMyProfile = computed(() => {
  if (!profile.userId || !myUserId.value) return false
  return String(profile.userId) === String(myUserId.value)
})

const followButtonLabel = computed(() => {
  if (profile.isBlocked) return '차단됨'
  if (profile.followStatus === 'PENDING') return '신청 중'
  if (profile.followStatus === 'ACCEPTED') return '팔로잉'
  return '팔로우'
})

const followButtonVariant = computed(() => {
  if (profile.followStatus === 'PENDING' || profile.followStatus === 'ACCEPTED') return 'outline'
  return 'default'
})

const showBudgetUsage = computed(() => {
  if (isMyProfile.value) return false
  const targetVisible = profile.profileVisibility || profile.shareLevel
  const visible = String(targetVisible || '').toUpperCase()
  const isPublic = visible === 'PUBLIC'
  const status = String(profile.followStatus || '').toUpperCase()
  const isFollowed = status === 'ACCEPTED'
  return isPublic || isFollowed
})

const expenseUsage = computed(() => {
  const budget = monthlyBudget.value || 0
  if (!budget) return 0
  return Math.max((monthlyExpenseAmount.value / budget) * 100, 0)
})

const impulseUsage = computed(() => {
  const budget = triggerBudget.value || 0
  if (!budget) return 0
  return Math.max((monthlyImpulseAmount.value / budget) * 100, 0)
})

const expenseUsageCap = computed(() => Math.min(Math.round(expenseUsage.value), 100))
const impulseUsageCap = computed(() => Math.min(Math.round(impulseUsage.value), 100))

const loadingFollow = ref(false)
const loadingBlock = ref(false)

// -------------------- Profile & Relationship loaders --------------------
const loadProfile = async () => {
  if (!targetUserId.value) return
  try {
    const res = await fetchUser(String(targetUserId.value))
    const data = res?.data ?? res

    profile.userId = toStr(data?.userId ?? targetUserId.value)
    profile.nickname = data?.nickname ?? ''
    profile.avatarUrl = data?.profileImageUrl ?? data?.avatarUrl ?? ''
    profile.bio = data?.bio ?? ''
    profile.location = data?.location ?? ''
    profile.joinedDate = data?.createdAt ?? data?.joinedDate ?? ''
  } catch (err) {
    console.error('Failed to load profile', err)
  }
}

const loadRelationship = async () => {
  if (!targetUserId.value) return

  if (String(targetUserId.value) === String(myUserId.value || '')) {
    profile.followStatus = 'NONE'
    profile.followRequestId = ''
    profile.isBlocked = false
    return
  }

  try {
    const res = await fetchFollowStatus(String(targetUserId.value))
    const data = res?.data ?? res
    const status = (data?.status ?? 'NONE').toUpperCase()

    profile.isBlocked = status === 'BLOCKED'
    profile.followStatus = status === 'PENDING' || status === 'ACCEPTED' ? status : 'NONE'
    profile.followRequestId = data?.requestId ? String(data.requestId) : ''
  } catch (err) {
    console.error('Failed to load follow status', err)
    profile.isBlocked = false
    profile.followStatus = 'NONE'
    profile.followRequestId = ''
  }
}

// 내 기준 팔로워/팔로잉(기존 유지)
const loadFollowCounts = async () => {
  try {
    const [followersRes, followingsRes] = await Promise.all([fetchFollowers(), fetchFollowings()])
    const followersData = followersRes?.data ?? followersRes
    const followingsData = followingsRes?.data ?? followingsRes

    stats.value[1].value = followersData?.totalCount ?? 0
    stats.value[2].value = followingsData?.totalCount ?? 0
  } catch (err) {
    console.error('Failed to load follow counts', err)
    stats.value[1].value = 0
    stats.value[2].value = 0
  }
}

// -------------------- Follow / Block actions --------------------
const toggleFollow = async () => {
  if (loadingFollow.value) return
  if (profile.isBlocked) return
  if (!profile.userId || isMyProfile.value) return

  loadingFollow.value = true
  try {
    if (profile.followStatus === 'NONE') {
      const res = await requestFollow(profile.userId)
      const data = res?.data ?? res

      const next = (data?.status ?? 'PENDING').toUpperCase()
      profile.followStatus = next === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING'
      profile.followRequestId = data?.followId ? String(data.followId) : ''
    } else if (profile.followStatus === 'PENDING') {
      if (!profile.followRequestId) {
        await loadRelationship()
        return
      }
      await cancelFollowRequest(profile.followRequestId)
      profile.followStatus = 'NONE'
      profile.followRequestId = ''
    } else if (profile.followStatus === 'ACCEPTED') {
      await unfollow(profile.userId)
      profile.followStatus = 'NONE'
      profile.followRequestId = ''
    }
  } catch (err) {
    console.error('follow toggle failed', err)
    await loadRelationship()
  } finally {
    loadingFollow.value = false
  }
}

const toggleBlock = async () => {
  if (loadingBlock.value) return
  if (!profile.userId || isMyProfile.value) return

  loadingBlock.value = true
  try {
    if (profile.isBlocked) {
      await unblock(profile.userId)
      profile.isBlocked = false
      await loadRelationship()
    } else {
      await block(profile.userId)
      profile.isBlocked = true
      profile.followStatus = 'NONE'
      profile.followRequestId = ''
    }
  } catch (err) {
    console.error('block toggle failed', err)
    await loadRelationship()
  } finally {
    loadingBlock.value = false
  }
}

const loadBudgetSummary = async () => {
  summaryLoading.value = true
  try {
    if (!showBudgetUsage.value) {
      budgetAccessDenied.value = true
      monthlyExpenseAmount.value = 0
      monthlyImpulseAmount.value = 0
      monthlyBudget.value = 0
      triggerBudget.value = 0
      return
    }

    const now = new Date()
    const summaryPromise = fetchUserTransactionSummary(targetUserId.value,{
      from: formatLocalDateTime(startOfMonth()),
      to: formatLocalDateTime(now),
    })

    if (isMyProfile.value) {
      const meRes = await fetchMe()
      monthlyBudget.value = meRes?.data?.monthlyBudget ?? 0
      triggerBudget.value = meRes?.data?.triggerBudget ?? 0
    }

    const sumRes = await summaryPromise
    monthlyExpenseAmount.value = sumRes?.data?.totalExpense ?? 0
    monthlyImpulseAmount.value = sumRes?.data?.totalImpulseExpense ?? 0
    budgetAccessDenied.value = false
  } catch (err) {
    console.error('loadBudgetSummary failed', err)
    if (err?.response?.status === 403) {
      budgetAccessDenied.value = true
    }
    monthlyExpenseAmount.value = 0
    monthlyImpulseAmount.value = 0
  } finally {
    summaryLoading.value = false
  }
}

const goEdit = () => router.push('/me')

const goPostDetail = (post) => {
  if (!post?.id || !post?.board) return
  router.push({
    name: 'postDetail',
    params: { boardId: Number(post.board), postId: post.id },
  })
}

const switchMainTab = async (key) => {
  activeMainTab.value = key
  if (key === 'commented') {
    if (!commentedPosts.value.length) {
      await loadCommentedPosts({ append: false })
    }
  } else {
    if (!posts.value.length) {
      await loadPosts({ append: false })
    }
  }
  await setupObserver()
}

const switchBoard = async (key) => {
  activeBoard.value = key
  if (activeMainTab.value === 'commented') {
    if (!commentedPosts.value.length) {
      await loadCommentedPosts({ append: false })
    }
  } else {
    if (!posts.value.length) {
      await loadPosts({ append: false })
    }
  }
  await setupObserver()
}

// -------------------- Stats / boards / posts --------------------
const stats = ref([
  { label: 'Posts', value: 0 },
  { label: 'Followers', value: 0 },
  { label: 'Following', value: 0 }
])

const posts = ref([])
const commentedPosts = ref([])
const boards = ref([])
const loadingPosts = ref(false)

const mainTabs = [
  { key: 'posts', label: '최근 게시글' },
  { key: 'commented', label: '내가 댓글 단 글' },
]
const boardTabs = computed(() => [
  { key: 'all', label: '전체' },
  ...boards.value.map((b) => ({ key: String(b.boardId), label: b.name })),
])

const activeMainTab = ref('posts')
const activeBoard = ref('all')

const totalPosts = ref(0)
const totalCommented = ref(0)

const filteredPosts = computed(() => {
  const source = activeMainTab.value === 'commented' ? commentedPosts.value : posts.value
  if (activeBoard.value === 'all') return source
  return source.filter((post) => String(post.board) === String(activeBoard.value))
})

const visibleItems = computed(() => filteredPosts.value)

const loadedCount = computed(() => filteredPosts.value.length)

// -------------------- donut 색상 (대시보드와 동일) --------------------
const PRIMARY_PIE_COLOR = '#fed253'
const NEUTRAL_PIE_COLORS = [
  'rgba(0,0,0,0.8)',
  'rgba(0,0,0,0.65)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.35)',
  'rgba(0,0,0,0.25)',
]
const donutColors = [PRIMARY_PIE_COLOR, ...NEUTRAL_PIE_COLORS]

// 예산 요약
const summaryLoading = ref(false)
const monthlyExpenseAmount = ref(0)
const monthlyImpulseAmount = ref(0)
const monthlyBudget = ref(0)
const triggerBudget = ref(0)
const budgetAccessDenied = ref(false)

const boardActivity = computed(() => {
  const total = totalPosts.value || 1
  const source =
    boards.value.length > 0
      ? boards.value.map((b) => ({ label: b.name, count: b.postCount || 0 }))
      : boardTabs.value
          .filter((tab) => tab.key !== 'all')
          .map((tab) => ({
            label: tab.label,
            count: posts.value.filter((post) => post.board === tab.key).length
          }))

  return source.map((item) => ({
    label: item.label,
    percent: Math.round(((item.count || 0) / total) * 100)
  }))
})

const boardSegments = computed(() => {
  let acc = 0
  return boardActivity.value.map((item, idx) => {
    const deg = item.percent * 3.6
    const start = acc
    const end = acc + deg
    acc = end
    return { ...item, start, end, color: donutColors[idx % donutColors.length] }
  })
})

const startOfMonth = () => {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

const formatLocalDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}



// -------------------- cursor infinite scroll 상태 --------------------
const cursor = ref(null)
const hasNext = ref(true)
const pageSize = ref(5)

const resetPosts = () => {
  posts.value = []
  cursor.value = null
  hasNext.value = true
  stats.value[0].value = 0
  totalPosts.value = 0
}

// 내 댓글 단 글 전용 커서
const commentedCursor = ref(null)
const commentedHasNext = ref(true)
const commentedPageSize = ref(5)
const resetCommented = () => {
  commentedPosts.value = []
  commentedCursor.value = null
  commentedHasNext.value = true
  totalCommented.value = 0
}

// ✅ 서버는 userId + cursor + size만 받는 구조로 맞춤
const loadPosts = async ({ append = false } = {}) => {
  if (loadingPosts.value) return
  if (!targetUserId.value) return
  if (append && !hasNext.value) return

  loadingPosts.value = true
  try {
    const res = await fetchUserPosts({
      userId: String(targetUserId.value),
      cursor: append ? cursor.value : null,
      size: pageSize.value
    })

    const data = res?.data ?? res
    totalPosts.value = Number(data?.totalCount ?? 0)

    const mapped = (data?.items ?? []).map((p) => ({
      id: p.postId ?? p.id,
      board: String(p.boardId),
      boardName: p.boardName ?? boards.value.find((b) => String(b.boardId) === String(p.boardId))?.name ?? '',
      title: p.title ?? '',
      excerpt: p.excerpt ?? '',
      date: p.createdAt ?? '',
      likes: p.likeCount ?? 0,
      comments: p.commentCount ?? 0
    }))

    if (append) posts.value.push(...mapped)
    else posts.value = mapped

    cursor.value = data?.nextCursor ?? null
    hasNext.value = !!data?.hasNext

    stats.value[0].value = totalPosts.value

  } catch (err) {
    console.error('Failed to load posts', err)
    if (!append) {
      posts.value = []
      stats.value[0].value = 0
    }
    hasNext.value = false
  } finally {
    loadingPosts.value = false
  }
}

const loadCommentedPosts = async ({ append = false } = {}) => {
  if (loadingPosts.value) return
  if (!targetUserId.value) return
  if (append && !commentedHasNext.value) return

  loadingPosts.value = true
  try {
    const res = await fetchUserComments({
      userId: String(targetUserId.value),
      cursor: append ? commentedCursor.value : null,
      size: commentedPageSize.value
    })
    const data = res?.data ?? res

    totalCommented.value = Number(data?.totalCount ?? 0)

    const mapped = (data?.items ?? []).map((c) => ({
      id: c.postId,
      board: String(c.boardId),
      boardName: c.boardName ?? '',
      title: c.postTitle ?? '(제목 없음)',
      excerpt: c.content ?? '',
      date: c.createdAt ?? '',
      likes: c.likeCount ?? 0,
      comments: c.commentCount ?? 0,
    }))

    if (append) commentedPosts.value.push(...mapped)
    else commentedPosts.value = mapped

    commentedCursor.value = data?.nextCursor ?? null
    commentedHasNext.value = !!data?.hasNext
  } catch (err) {
    console.error('Failed to load commented posts', err)
    if (!append) commentedPosts.value = []
    commentedHasNext.value = false
  } finally {
    loadingPosts.value = false
  }
}

const loadBoards = async () => {
  try {
    const res = await fetchBoards()
    boards.value = res?.data?.items ?? []
  } catch (err) {
    console.error('Failed to load boards', err)
    boards.value = []
  }
}

// -------------------- IntersectionObserver (내부 스크롤 컨테이너) --------------------
const postsScrollRoot = ref(null)
const sentinel = ref(null)
let io = null

const setupObserver = async () => {
  await nextTick()

  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null

  if (!postsScrollRoot.value || !sentinel.value) return

  io = new IntersectionObserver(
    (entries) => {
      if (entries?.[0]?.isIntersecting) {
        if (activeMainTab.value === 'commented') {
          loadCommentedPosts({ append: true })
        } else {
          loadPosts({ append: true })
        }
      }
    },
    {
      root: postsScrollRoot.value, // ✅ 내부 스크롤
      threshold: 0,
      rootMargin: '120px'
    }
  )

  io.observe(sentinel.value)
}

onMounted(() => {
  setupObserver()
})

onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null
})

// 탭 바뀌면: 목록 초기화 + 첫 페이지 + observer 재설정(스크롤 루트가 유지돼도 안전)

// targetUserId 바뀌면: 전체 로드 후 posts 초기 로드
watch(
  targetUserId,
  async (id) => {
    if (!id) return
    profile.userId = String(id)

    await loadProfile()
    await loadRelationship()
    await loadBoards()
    await loadFollowCounts()
    await loadBudgetSummary()

    // ✅ 여기 추가
    await challengeStore.loadChallenges()

    activeMainTab.value = 'posts'
    activeBoard.value = 'all'
    resetPosts()
    resetCommented()
    await loadPosts({ append: false })
    await setupObserver()
  },
  { immediate: true }
)
</script>
