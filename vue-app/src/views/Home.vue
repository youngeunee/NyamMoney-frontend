<template>
  <Layout>
    <div class="p-6 space-y-8">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold">Dashboard</h1>
          <p class="text-sm text-muted-foreground">오늘 소비와 시발비용을 한눈에 확인하세요.</p>
        </div>
        <div class="text-xs text-muted-foreground">
          업데이트: {{ lastUpdated }}
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UiCard>
          <template #header>
            <div class="px-4 pt-4 text-xs text-muted-foreground">오늘 지출</div>
          </template>
          <div class="space-y-1">
            <div class="text-2xl font-semibold">{{ formatCurrency(todayExpense) }}원</div>
            <p class="text-xs text-muted-foreground">자정 이후 총 지출</p>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="px-4 pt-4 text-xs text-muted-foreground">오늘 시발비용</div>
          </template>
          <div class="space-y-1">
            <div class="text-2xl font-semibold text-primary">{{ formatCurrency(todayImpulse) }}원</div>
            <p class="text-xs text-muted-foreground">오늘 충동 지출</p>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="px-4 pt-4 text-xs text-muted-foreground">이번 달 지출</div>
          </template>
          <div class="space-y-1">
            <div class="text-2xl font-semibold">{{ formatCurrency(monthlyExpense) }}원</div>
            <p class="text-xs text-muted-foreground">월간 총 지출</p>
          </div>
        </UiCard>

        <UiCard>
          <template #header>
            <div class="px-4 pt-4 text-xs text-muted-foreground">이번 달 시발비용</div>
          </template>
          <div class="space-y-1">
            <div class="text-2xl font-semibold text-primary">{{ formatCurrency(monthlyImpulse) }}원</div>
            <p class="text-xs text-muted-foreground">월간 충동 지출</p>
          </div>
        </UiCard>
      </div>

      <div>
        <button
          class="w-full py-4 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:opacity-90 transition"
          @click="goCreate"
          type="button"
        >
          소비내역 등록하기
        </button>
      </div>

      <UiCard wrapperClass="border border-border">
        <template #header>
          <div class="px-4 pt-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">오늘 카테고리 비율</p>
              <p class="text-sm font-semibold">총 지출 vs. 시발비용</p>
            </div>
            <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
              <UiSpinner /> 불러오는 중
            </div>
          </div>
        </template>
        <div v-if="todayCategoryBars.length" class="p-4 grid gap-6 md:grid-cols-2">
          <div class="space-y-3">
            <p class="text-sm font-semibold">총 지출</p>
            <div class="flex items-center gap-4">
              <div class="relative h-32 w-32 rounded-full" :style="pieStyle(expenseSegments)"></div>
              <div class="flex-1 space-y-2">
                <template v-if="expenseSegments.length">
                  <div
                    v-for="seg in expenseSegments"
                    :key="seg.id"
                    class="flex items-center justify-between text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <span class="h-3 w-3 rounded-sm" :style="{ background: seg.color }"></span>
                      <span>{{ seg.name }}</span>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold">{{ formatCurrency(seg.amount) }}원</p>
                      <p class="text-[11px] text-muted-foreground">{{ seg.percent }}%</p>
                    </div>
                  </div>
                </template>
                <p v-else class="text-sm text-muted-foreground">지출이 없습니다.</p>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <p class="text-sm font-semibold">시발비용</p>
            <div class="flex items-center gap-4">
              <div class="relative h-32 w-32 rounded-full" :style="pieStyle(impulseSegments)"></div>
              <div class="flex-1 space-y-2">
                <template v-if="impulseSegments.length">
                  <div
                    v-for="seg in impulseSegments"
                    :key="seg.id"
                    class="flex items-center justify-between text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <span class="h-3 w-3 rounded-sm" :style="{ background: seg.color }"></span>
                      <span>{{ seg.name }}</span>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold">{{ formatCurrency(seg.amount) }}원</p>
                      <p class="text-[11px] text-muted-foreground">{{ seg.percent }}%</p>
                    </div>
                  </div>
                </template>
                <p v-else class="text-sm text-muted-foreground">시발비용 지출이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="p-4 text-sm text-muted-foreground text-center">
          오늘 지출 카테고리 데이터가 없습니다.
        </div>
      </UiCard>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <FinancialChart :data="chartData" />
        </div>
        <UiCard wrapperClass="border border-border h-full">
          <template #header>
            <div class="flex items-center justify-between px-4 pt-4">
              <div>
                <p class="text-xs text-muted-foreground">월간 요약</p>
                <p class="text-sm font-semibold">이번 달 통계</p>
              </div>
              <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
                <UiSpinner /> 로딩 중
              </div>
            </div>
          </template>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">총 지출</span>
              <span class="font-semibold">{{ formatCurrency(monthlyExpense) }}원</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">시발비용</span>
              <span class="font-semibold text-primary">{{ formatCurrency(monthlyImpulse) }}원</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">시발비용 비중</span>
              <span class="font-semibold">
                {{ monthlyExpense ? Math.round((monthlyImpulse / monthlyExpense) * 100) : 0 }}%
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">거래 건수</span>
              <span class="font-semibold">{{ transactionCount }}건</span>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <RecentTransactions
          class="lg:col-span-2"
          :transactions="recentTransactions"
          :loading="loading"
          :limit="6"
          @viewAll="goAnalytics"
        />

        <UiCard wrapperClass="border border-border h-full">
          <template #header>
            <div class="px-4 pt-4">
              <p class="text-xs text-muted-foreground">최근 일별 합계</p>
              <p class="text-sm font-semibold">마지막 5일</p>
            </div>
          </template>
          <div v-if="loading" class="flex items-center justify-center py-6">
            <UiSpinner />
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in lastFiveDays"
              :key="item.label"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex flex-col">
                <span class="font-medium">{{ item.label }}</span>
                <span class="text-xs text-muted-foreground">시발비용 {{ formatCurrency(item.impulse ?? 0) }}원</span>
              </div>
              <span class="font-semibold">{{ formatCurrency(item.expense ?? 0) }}원</span>
            </div>
          </div>
        </UiCard>
      </div>

      <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
    </div>
  </Layout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import FinancialChart from '@/components/FinancialChart.vue'
import RecentTransactions from '@/components/RecentTransactions.vue'
import {
  fetchTransactionDailySummary,
  fetchTransactionSummary,
  fetchTransactions,
} from '@/services/transaction.service'

const CATEGORY_LABELS: Record<number, string> = {
  1: '식사',
  2: '카페·간식',
  3: '쇼핑',
  4: '이동·차량',
  5: '주거·생활요금',
  6: '건강·의료',
  7: '교육',
  8: '여가·취미',
  9: '금융',
  10: '기타',
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f97316', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#3b82f6', '#84cc16', '#0ea5e9']

type Summary = {
  totalExpense?: number
  totalImpulseExpense?: number
}

type DailySummary = {
  date: string
  totalExpense?: number
  totalImpulseExpense?: number
  categorySummaries?: CategorySummaryItem[]
}

type TransactionItem = {
  transactionId: number
  occurredAt?: string
  amount?: number
  merchantNameRaw?: string
  impulseFlag?: boolean
  isRefund?: boolean
  type?: 'expense' | 'refund' | 'income'
}

type CategorySummaryItem = {
  categoryId?: number
  category?: number
  categoryName?: string
  name?: string
  amount?: number
  expense?: number
  totalExpense?: number
}

type CategoryBar = {
  id: number
  name: string
  amount: number
  impulse: number
}

export default defineComponent({
  name: 'HomeView',
  components: {
    Layout,
    UiCard,
    UiSpinner,
    FinancialChart,
    RecentTransactions,
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const error = ref('')
    const todaySummary = ref<Summary | null>(null)
    const monthlySummary = ref<Summary | null>(null)
    const dailySummary = ref<DailySummary[]>([])
    const todayCategoryBars = ref<CategoryBar[]>([])
    const recentTransactions = ref<TransactionItem[]>([])
    const transactionCount = ref(0)
    const lastUpdated = ref(new Date().toLocaleString('ko-KR'))

    const formatCurrency = (value?: number | null) => {
      return (value ?? 0).toLocaleString('ko-KR')
    }

    const formatLocalDateTime = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours(),
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    const startOfToday = () => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }

    const startOfMonth = () => {
      const d = new Date()
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d
    }

    const dateKey = (value: string | Date) => {
      const d = new Date(value)
      d.setHours(0, 0, 0, 0)
      return d.toISOString().slice(0, 10)
    }

    const todayExpense = computed(() => todaySummary.value?.totalExpense ?? 0)
    const todayImpulse = computed(() => todaySummary.value?.totalImpulseExpense ?? 0)
    const monthlyExpense = computed(() => monthlySummary.value?.totalExpense ?? 0)
    const monthlyImpulse = computed(() => monthlySummary.value?.totalImpulseExpense ?? 0)

    const chartData = computed(() =>
      dailySummary.value.map((item) => {
        const d = new Date(item.date)
        const label = `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
        return {
          label,
          expense: item.totalExpense ?? 0,
          impulse: item.totalImpulseExpense ?? 0,
        }
      }),
    )

    const lastFiveDays = computed(() => chartData.value.slice(-5))

    const buildTodayCategoryBars = (daily: DailySummary[]): CategoryBar[] => {
      const todayKey = dateKey(new Date())
      const todayEntry = daily.find((item) => dateKey(item.date) === todayKey)
      const categories = (todayEntry as any)?.categorySummaries ?? (todayEntry as any)?.categories ?? []
      const rows: CategoryBar[] = []
      for (let id = 1; id <= 10; id += 1) {
        const found = Array.isArray(categories)
          ? categories.find((c: CategorySummaryItem) => Number(c.categoryId ?? c.category) === id)
          : undefined
        const amount = found?.amount ?? found?.totalExpense ?? found?.expense ?? 0
        const impulse =
          found?.impulse ??
          found?.impulseAmount ??
          found?.impulseExpense ??
          found?.totalImpulse ??
          found?.totalImpulseExpense ??
          0
        if (amount > 0 || impulse > 0) {
          rows.push({
            id,
            name: found?.categoryName ?? found?.name ?? CATEGORY_LABELS[id] ?? `카테고리 ${id}`,
            amount,
            impulse,
          })
        }
      }
      return rows.sort((a, b) => b.amount - a.amount)
    }

    const buildSegments = (items: CategoryBar[], key: 'amount' | 'impulse') => {
      const total = items.reduce((sum, cur) => sum + (cur[key] ?? 0), 0)
      if (!total) return []
      return items
        .map((item, index) => {
          const amount = item[key] ?? 0
          if (!amount) return null
          const percent = Math.round((amount / total) * 1000) / 10
          return {
            id: item.id,
            name: item.name,
            amount,
            percent,
            color: PIE_COLORS[index % PIE_COLORS.length],
          }
        })
        .filter(Boolean) as {
        id: number
        name: string
        amount: number
        percent: number
        color: string
      }[]
    }

    const pieStyle = (segments: { percent: number; color: string }[]) => {
      if (!segments.length) return { background: '#e5e7eb' }
      let current = 0
      const parts: string[] = []
      segments.forEach((seg) => {
        const start = current
        const end = current + seg.percent
        parts.push(`${seg.color} ${start}% ${end}%`)
        current = end
      })
      return { background: `conic-gradient(${parts.join(', ')})` }
    }

    const expenseSegments = computed(() => buildSegments(todayCategoryBars.value, 'amount'))
    const impulseSegments = computed(() => buildSegments(todayCategoryBars.value, 'impulse'))

    const mapTransactionType = (tx: TransactionItem) => {
      if (tx.isRefund) return 'refund'
      return 'expense'
    }

    const loadDashboard = async () => {
      loading.value = true
      error.value = ''
      try {
        const now = new Date()
        const [todayRes, monthRes, dailyRes, txRes] = await Promise.all([
          fetchTransactionSummary({
            from: formatLocalDateTime(startOfToday()),
            to: formatLocalDateTime(now),
          }),
          fetchTransactionSummary({
            from: formatLocalDateTime(startOfMonth()),
            to: formatLocalDateTime(now),
          }),
          fetchTransactionDailySummary({
            from: formatLocalDateTime(startOfMonth()),
            to: formatLocalDateTime(now),
          }),
          fetchTransactions({
            from: formatLocalDateTime(startOfMonth()),
            to: formatLocalDateTime(now),
            size: 10,
          }),
        ])

        todaySummary.value = todayRes.data
        monthlySummary.value = monthRes.data
        dailySummary.value = dailyRes.data ?? []
        todayCategoryBars.value = buildTodayCategoryBars(dailySummary.value)
        const items: TransactionItem[] = txRes.data?.items ?? []
        transactionCount.value = txRes.data?.totalCount ?? items.length
        recentTransactions.value = items.map((it) => ({
          ...it,
          type: mapTransactionType(it),
        }))

        lastUpdated.value = new Date().toLocaleString('ko-KR')
      } catch (e) {
        console.error(e)
        error.value = '대시보드 데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    onMounted(loadDashboard)

    const goAnalytics = () => {
      router.push({ name: 'Analytics' })
    }
    const goCreate = () => {
      router.push({ name: 'TransactionCreate' })
    }

    return {
      loading,
      error,
      todayExpense,
      todayImpulse,
      monthlyExpense,
      monthlyImpulse,
      chartData,
      lastFiveDays,
      todayCategoryBars,
      expenseSegments,
      impulseSegments,
      pieStyle,
      recentTransactions,
      transactionCount,
      formatCurrency,
      lastUpdated,
      goAnalytics,
      goCreate,
    }
  },
})
</script>
