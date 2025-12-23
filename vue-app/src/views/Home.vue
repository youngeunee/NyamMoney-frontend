<template>
  <Layout>
    <div class="p-6 space-y-6">
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
              <p class="text-xs text-muted-foreground">이번 달 예산 사용률</p>
              <p class="text-sm font-semibold">소비 & 시발비용</p>
            </div>
            <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
              <UiSpinner /> 불러오는 중
            </div>
          </div>
        </template>

        <div class="p-4 space-y-6 grid gap-6 lg:grid-cols-2">
          <div class="flex items-center gap-4">
            <div class="relative inline-block donut-wrapper">
              <svg viewBox="0 0 36 36" class="h-32 w-32">
                <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
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
            <div class="space-y-1 text-sm">
              <p class="font-semibold text-foreground">이번 달 시발비용</p>
              <p class="text-muted-foreground">
                {{ formatCurrency(monthlyImpulse) }}원 / {{ formatCurrency(triggerBudget || 0) }}원
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="relative inline-block donut-wrapper">
              <svg viewBox="0 0 36 36" class="h-32 w-32">
                <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
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
            <div class="space-y-1 text-sm">
              <p class="font-semibold text-foreground">이번 달 소비 금액</p>
              <p class="text-muted-foreground">
                {{ formatCurrency(monthlyExpense) }}원 / {{ formatCurrency(monthlyBudget || 0) }}원
              </p>
            </div>
          </div>
        </div>
      </UiCard>

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
              <div class="relative inline-block donut-wrapper">
                <svg viewBox="0 0 36 36" class="h-32 w-32">
                  <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                  <circle
                    v-for="arc in expenseArcs"
                    :key="arc.id"
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    :stroke="arc.color"
                    stroke-width="6"
                    stroke-linecap="butt"
                    :stroke-dasharray="`${arc.percent} ${100 - arc.percent}`"
                    :stroke-dashoffset="arc.offset"
                    @mouseenter="onArcEnter(arc, $event, 'expense')"
                    @mousemove="onArcEnter(arc, $event, 'expense')"
                    @mouseleave="hideTooltip"
                    style="transition: opacity 0.15s ease"
                  />
                  <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                </svg>
                <div
                  v-if="tooltip.visible && tooltip.type === 'expense'"
                  class="absolute z-10 rounded-md bg-card border border-border px-3 py-2 text-xs shadow-sm"
                  :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
                >
                  <div class="font-semibold">{{ tooltip.label }}</div>
                  <div class="text-muted-foreground">{{ formatCurrency(tooltip.amount) }}원 · {{ tooltip.percent }}%</div>
                </div>
              </div>
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
              <div class="relative inline-block donut-wrapper">
                <svg viewBox="0 0 36 36" class="h-32 w-32">
                  <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                  <circle
                    v-for="arc in impulseArcs"
                    :key="arc.id"
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    :stroke="arc.color"
                    stroke-width="6"
                    stroke-linecap="butt"
                    :stroke-dasharray="`${arc.percent} ${100 - arc.percent}`"
                    :stroke-dashoffset="arc.offset"
                    @mouseenter="onArcEnter(arc, $event, 'impulse')"
                    @mousemove="onArcEnter(arc, $event, 'impulse')"
                    @mouseleave="hideTooltip"
                    style="transition: opacity 0.15s ease"
                  />
                  <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                </svg>
                <div
                  v-if="tooltip.visible && tooltip.type === 'impulse'"
                  class="absolute z-10 rounded-md bg-card border border-border px-3 py-2 text-xs shadow-sm"
                  :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
                >
                  <div class="font-semibold">{{ tooltip.label }}</div>
                  <div class="text-muted-foreground">{{ formatCurrency(tooltip.amount) }}원 · {{ tooltip.percent }}%</div>
                </div>
              </div>
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
                <p class="text-xs text-muted-foreground">이번달 요약</p>
                <p class="text-sm font-semibold">이번달 현황</p>
              </div>
              <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
                <UiSpinner /> 불러오는 중
              </div>
            </div>
          </template>
          <div class="space-y-3">
            <ExpenseIncomeSummary
              label="이달 소비 / 수입"
              :expense="monthlyExpense"
              :income="monthlyIncome"
            />
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">총 지출</span>
              <span class="font-semibold text-foreground">
                {{ formatCurrency(monthlyExpense) }}원
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">충동 소비</span>
              <span class="font-semibold text-primary">{{ formatCurrency(monthlyImpulse) }}원</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">충동 소비 비율</span>
              <span class="font-semibold">
                {{ monthlyExpense ? Math.round((monthlyImpulse / monthlyExpense) * 100) : 0 }}%
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">내역 개수</span>
              <span class="font-semibold">{{ transactionCount }}개</span>
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
import ExpenseIncomeSummary from '@/components/ExpenseIncomeSummary.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import FinancialChart from '@/components/FinancialChart.vue'
import RecentTransactions from '@/components/RecentTransactions.vue'
import {
  fetchTransactionDailySummary,
  fetchTransactionSummary,
  fetchTransactions,
} from '@/services/transaction.service'
import { fetchMe } from '@/services/user.service'

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

const PRIMARY_PIE_COLOR = '#fed253'
const NEUTRAL_PIE_COLORS = [
  'rgba(0,0,0,0.8)',
  'rgba(0,0,0,0.65)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.35)',
  'rgba(0,0,0,0.25)',
]

type Summary = {
  totalExpense?: number
  totalImpulseExpense?: number
  totalIncome?: number
}

type DailySummary = {
  date: string
  totalExpense?: number
  totalImpulseExpense?: number
  totalIncome?: number
  categorySummaries?: CategorySummaryItem[]
  categoryImpulseSummaries?: CategorySummaryItem[]
}

type TransactionItem = {
  transactionId: number
  occurredAt?: string
  amount?: number
  merchantNameRaw?: string
  impulseFlag?: boolean
  isRefund?: boolean
  type?: 'expense' | 'refund' | 'income'
  transactionType?: string
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
    ExpenseIncomeSummary,
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
    const monthlyBudget = ref<number>(0)
    const triggerBudget = ref<number>(0)
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
    const monthlyIncome = computed(() => monthlySummary.value?.totalIncome ?? 0)
    const expenseUsage = computed(() => {
      const budget = monthlyBudget.value || 0
      if (!budget) return 0
      return Math.max(0, Math.min((monthlyExpense.value / budget) * 100, 100))
    })
    const impulseUsage = computed(() => {
      const budget = triggerBudget.value || 0
      if (!budget) return 0
      return Math.max(0, Math.min((monthlyImpulse.value / budget) * 100, 100))
    })
    const expenseUsageCap = computed(() => Math.min(Math.round(expenseUsage.value), 100))
    const impulseUsageCap = computed(() => Math.min(Math.round(impulseUsage.value), 100))

    const chartData = computed(() => {
      const sorted = [...dailySummary.value].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      let accExpense = 0
      let accImpulse = 0
      let accIncome = 0

      return sorted.map((item) => {
        accExpense += item.totalExpense ?? 0
        accImpulse += item.totalImpulseExpense ?? 0
        accIncome += item.totalIncome ?? 0
        const d = new Date(item.date)
        const label = `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
        return {
          label,
          expense: accExpense,
          impulse: accImpulse,
          income: accIncome,
        }
      })
    })

    const lastFiveDays = computed(() => chartData.value.slice(-5))

    const buildTodayCategoryBars = (daily: DailySummary[]): CategoryBar[] => {
      const todayKey = dateKey(new Date())
      const todayEntry = daily.find((item) => dateKey(item.date) === todayKey)
      const expenseCats = (todayEntry as any)?.categorySummaries ?? (todayEntry as any)?.categories ?? []
      const impulseCats = (todayEntry as any)?.categoryImpulseSummaries ?? []

      const map = new Map<number, CategoryBar>()

      if (Array.isArray(expenseCats)) {
        expenseCats.forEach((c: CategorySummaryItem) => {
          const id = Number(c.categoryId ?? c.category)
          if (!id) return
          const amount = c.amount ?? c.totalExpense ?? c.expense ?? 0
          const name = c.categoryName ?? c.name ?? CATEGORY_LABELS[id] ?? `카테고리 ${id}`
          map.set(id, {
            id,
            name,
            amount,
            impulse: map.get(id)?.impulse ?? 0,
          })
        })
      }

      if (Array.isArray(impulseCats)) {
        impulseCats.forEach((c: CategorySummaryItem) => {
          const id = Number(c.categoryId ?? c.category)
          if (!id) return
          const impulse =
            c.amount ??
            c.impulseAmount ??
            c.impulseExpense ??
            c.totalImpulseExpense ??
            c.totalImpulse ??
            c.expense ??
            0
          const existing = map.get(id)
          if (existing) {
            existing.impulse = impulse
          } else {
            const name = c.categoryName ?? c.name ?? CATEGORY_LABELS[id] ?? `카테고리 ${id}`
            map.set(id, {
              id,
              name,
              amount: 0,
              impulse,
            })
          }
        })
      }

      const rows = Array.from(map.values()).filter((r) => r.amount > 0 || r.impulse > 0)
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
          const color =
            index === 0
              ? PRIMARY_PIE_COLOR
              : NEUTRAL_PIE_COLORS[(index - 1) % NEUTRAL_PIE_COLORS.length]
          return {
            id: item.id,
            name: item.name,
            amount,
            percent,
            color,
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

    const expenseSegments = computed(() => buildSegments(todayCategoryBars.value, 'amount'))
    const impulseSegments = computed(() => buildSegments(todayCategoryBars.value, 'impulse'))

    const buildArcs = (segments: ReturnType<typeof buildSegments>) => {
      let offset = 0
      return segments.map((seg) => {
        const arc = {
          ...seg,
          offset: -offset,
        }
        offset += seg.percent
        return arc
      })
    }

    const expenseArcs = computed(() => buildArcs(expenseSegments.value))
    const impulseArcs = computed(() => buildArcs(impulseSegments.value))

    const tooltip = ref({ visible: false, x: 0, y: 0, label: '', amount: 0, percent: 0, type: '' })

    const onArcEnter = (seg: any, event: MouseEvent, type: 'expense' | 'impulse') => {
      const wrapper = (event.currentTarget as HTMLElement)?.closest('.donut-wrapper') as HTMLElement | null
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const x = event.clientX - rect.left + 8
      const y = event.clientY - rect.top + 8
      tooltip.value = {
        visible: true,
        x,
        y,
        label: seg.name,
        amount: seg.amount,
        percent: seg.percent,
        type,
      }
    }

    const hideTooltip = () => {
      tooltip.value = { visible: false, x: 0, y: 0, label: '', amount: 0, percent: 0, type: '' }
    }

    const resolveTransactionType = (tx: TransactionItem): TransactionItem['type'] => {
      const raw = (tx.type || tx.transactionType || '').toString().toLowerCase()
      if (tx.isRefund || raw === 'refund') return 'refund'
      if (raw === 'income') return 'income'
      return 'expense'
    }

    const mapTransactionType = (tx: TransactionItem) => resolveTransactionType(tx)

    const loadDashboard = async () => {
      loading.value = true
      error.value = ''
      try {
        const now = new Date()
        const [todayRes, monthRes, dailyRes, txRes, meRes] = await Promise.all([
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
          fetchMe(),
        ])

        todaySummary.value = todayRes.data
        monthlySummary.value = monthRes.data
        dailySummary.value = dailyRes.data ?? []
        monthlyBudget.value = meRes?.data?.monthlyBudget ?? 0
        triggerBudget.value = meRes?.data?.triggerBudget ?? 0
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
      monthlyIncome,
      chartData,
      lastFiveDays,
      todayCategoryBars,
      expenseSegments,
      impulseSegments,
      expenseArcs,
      impulseArcs,
      tooltip,
      onArcEnter,
      hideTooltip,
      recentTransactions,
      transactionCount,
      formatCurrency,
      lastUpdated,
      goAnalytics,
      goCreate,
      monthlyBudget,
      triggerBudget,
      expenseUsage,
      impulseUsage,
      expenseUsageCap,
      impulseUsageCap,
    }
  },
})
</script>
