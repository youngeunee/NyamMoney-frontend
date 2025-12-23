<template>
  <Layout>
    <div class="p-6 space-y-6">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold">거래 내역</h1>
          <p class="text-sm text-muted-foreground">기간을 선택해 지출과 시발비용을 확인하세요.</p>
        </div>
        <div class="text-xs text-muted-foreground">총 {{ totalCount }}건</div>
      </div>

      <UiCard>
        <template #header>
          <div class="px-4 pt-4 flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <input v-model="filters.from" type="date" class="border border-border rounded-md p-2 text-sm" />
              <span class="text-xs text-muted-foreground">~</span>
              <input v-model="filters.to" type="date" class="border border-border rounded-md p-2 text-sm" />
            </div>
            <button
              class="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              @click="applyFilters"
            >
              적용
            </button>
            <span v-if="rangeLabel" class="text-xs text-muted-foreground">기간: {{ rangeLabel }}</span>
          </div>
        </template>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ExpenseIncomeSummary
            class="md:col-span-2 lg:col-span-2"
            label="총 지출 / 총 수입"
            :expense="summary.totalExpense"
            :income="summary.totalIncome"
          />
          <div class="p-4 rounded-md border border-border bg-card">
            <p class="text-xs text-muted-foreground mb-1">총 시발비용</p>
            <p class="text-2xl font-semibold text-primary">{{ formatCurrency(summary.totalImpulseExpense) }}원</p>
          </div>
          <div class="p-4 rounded-md border border-border bg-card">
            <p class="text-xs text-muted-foreground mb-1">시발비용 비중</p>
            <p class="text-2xl font-semibold">
              {{ summary.totalExpense ? Math.round((summary.totalImpulseExpense / summary.totalExpense) * 100) : 0 }}%
            </p>
          </div>
          <div class="p-4 rounded-md border border-border bg-card">
            <p class="text-xs text-muted-foreground mb-1">거래 건수</p>
            <p class="text-2xl font-semibold">{{ totalCount }}건</p>
          </div>
        </div>
      </UiCard>

      <UiCard wrapperClass="border border-border bg-card">
        <template #header>
          <div class="px-4 pt-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">카테고리별 소비</p>
              <p class="text-sm font-semibold">범위 내 합계</p>
            </div>
            <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
              <UiSpinner /> 불러오는 중
            </div>
          </div>
        </template>
        <div v-if="categoryRows.length" class="p-4 space-y-3">
          <div v-for="row in categoryRows" :key="row.key" class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ row.name }}</span>
              <span class="font-semibold">{{ formatCurrency(row.expense) }}원</span>
            </div>
            <div class="h-2 rounded-md bg-muted/40 overflow-hidden">
              <div class="h-2 bg-primary rounded-md" :style="{ width: categoryBarWidth(row) }"></div>
            </div>
          </div>
        </div>
        <div v-else class="p-6 text-center text-sm text-muted-foreground">
          카테고리별 데이터가 없습니다.
        </div>
      </UiCard>
      
      <UiCard wrapperClass="border border-border bg-card">
        <template #header>
          <div class="px-4 pt-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">기간별 거래</p>
              <p class="text-sm font-semibold">최근 순</p>
            </div>
            <div v-if="loading" class="text-xs text-muted-foreground flex items-center gap-2">
              <UiSpinner /> 로딩 중
            </div>
          </div>
        </template>

        <div class="divide-y divide-border">
          <button
            v-for="tx in transactions"
            :key="tx.transactionId"
            class="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-muted transition-colors"
            @click="goDetail(tx.transactionId)"
            type="button"
          >
            <div class="flex-1">
              <p class="text-sm font-semibold text-foreground">
                {{ tx.merchantNameRaw || '거래' }}
              </p>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ formatDate(tx.occurredAt) }}
              </p>
              <div class="mt-1 flex items-center gap-2">
                <span
                  v-if="tx.impulseFlag"
                  class="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold"
                >
                  시발비용
                </span>
                <span
                  v-if="tx.isRefund"
                  class="inline-flex items-center rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-[11px] font-semibold"
                >
                  환불
                </span>
              </div>
            </div>
            <div class="text-right">
              <div :class="['text-sm font-semibold', amountClass(tx)]">
                {{ amountPrefix(tx) }}{{ formatCurrency(tx.amount) }}원
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ tx.paymentMethod || '결제수단 없음' }}</p>
            </div>
          </button>

          <div v-if="!loading && !transactions.length" class="p-6 text-center text-sm text-muted-foreground">
            선택한 기간에 거래가 없습니다.
          </div>

          <div v-if="loadingMore" class="p-4 text-center text-sm text-muted-foreground">
            <UiSpinner />
          </div>
          <div ref="sentinel" class="h-6"></div>
        </div>
      </UiCard>

      <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
    </div>
  </Layout>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import ExpenseIncomeSummary from '@/components/ExpenseIncomeSummary.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import { fetchTransactionSummary, fetchTransactions } from '@/services/transaction.service'

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Category 1',
  2: 'Category 2',
  3: 'Category 3',
  4: 'Category 4',
  5: 'Category 5',
  6: 'Category 6',
  7: 'Category 7',
  8: 'Category 8',
  9: 'Category 9',
  10: 'Category 10',
}

type TransactionItem = {
  transactionId: number
  occurredAt?: string
  amount?: number
  merchantNameRaw?: string
  paymentMethod?: string
  impulseFlag?: boolean
  isRefund?: boolean
  transactionType?: string
  type?: 'expense' | 'income' | 'refund'
}

type Summary = {
  totalExpense: number
  totalImpulseExpense: number
  totalIncome: number
}

type CategorySummaryItem = {
  categoryId?: number
  categoryName?: string
  category?: number | string
  name?: string
  totalExpense?: number
  expense?: number
  amount?: number
  totalImpulseExpense?: number
  totalImpulse?: number
  impulseExpense?: number
  impulseAmount?: number
}

export default defineComponent({
  name: 'AnalyticsView',
  components: {
    Layout,
    ExpenseIncomeSummary,
    UiCard,
    UiSpinner,
  },
  setup() {
    const router = useRouter()
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const filters = reactive({
      from: formatDateInput(startOfMonth),
      to: formatDateInput(today),
    })

    const summary = reactive<Summary>({
      totalExpense: 0,
      totalImpulseExpense: 0,
      totalIncome: 0,
    })

    const transactions = ref<TransactionItem[]>([])
    const nextCursor = ref<string | null>(null)
    const hasNext = ref(false)
    const totalCount = ref(0)
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref('')

    const sentinel = ref<HTMLElement | null>(null)
    let observer: IntersectionObserver | null = null

    const rangeLabel = computed(() => {
      if (!filters.from || !filters.to) return ''
      return `${filters.from} ~ ${filters.to}`
    })

    function formatDateInput(date: Date) {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }

    const formatLocalDateTime = (date: Date, endOfDay = false) => {
      const d = new Date(date)
      if (endOfDay) {
        d.setHours(23, 59, 59, 999)
      } else {
        d.setHours(0, 0, 0, 0)
      }
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes(),
      )}:${pad(d.getSeconds())}`
    }

    const formatCurrency = (value?: number) => {
      return (value ?? 0).toLocaleString('ko-KR')
    }

    const formatDate = (value?: string) => {
      if (!value) return ''
      const d = new Date(value)
      return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    const resolveTransactionType = (tx: TransactionItem): TransactionItem['type'] => {
      const raw = (tx.transactionType || tx.type || '').toString().toLowerCase()
      if (tx.isRefund || raw === 'refund') return 'refund'
      if (raw === 'income') return 'income'
      return 'expense'
    }

    const amountPrefix = (tx: TransactionItem) => {
      const type = tx.type || resolveTransactionType(tx)
      return type === 'income' || type === 'refund' ? '+' : '-'
    }
    const amountClass = (tx: TransactionItem) => {
      const type = tx.type || resolveTransactionType(tx)
      return type === 'income' || type === 'refund' ? 'text-primary' : 'text-secondary'
    }

    const validateRange = () => {
      if (!filters.from || !filters.to) {
        error.value = '기간을 모두 선택해주세요.'
        return false
      }
      const start = new Date(filters.from)
      const end = new Date(filters.to)
      if (start > end) {
        error.value = '시작일이 종료일 이후일 수 없습니다.'
        return false
      }
      return true
    }

    const mapTransactionType = (tx: TransactionItem) => ({
      ...tx,
      type: resolveTransactionType(tx),
    })

    const loadSummary = async () => {
      const from = formatLocalDateTime(new Date(filters.from))
      const to = formatLocalDateTime(new Date(filters.to), true)
      const res = await fetchTransactionSummary({ from, to })
      summary.totalExpense = res.data?.totalExpense ?? 0
      summary.totalImpulseExpense = res.data?.totalImpulseExpense ?? 0
      summary.totalIncome = res.data?.totalIncome ?? 0
    }

    const loadTransactions = async (reset = false) => {
      if (reset) {
        transactions.value = []
        nextCursor.value = null
        hasNext.value = false
        totalCount.value = 0
      }
      const from = formatLocalDateTime(new Date(filters.from))
      const to = formatLocalDateTime(new Date(filters.to), true)
      const params: Record<string, unknown> = {
        from,
        to,
        size: 20,
      }
      if (!reset && nextCursor.value) {
        params.cursor = nextCursor.value
      }

      if (reset) {
        loading.value = true
      } else {
        loadingMore.value = true
      }

      try {
        const res = await fetchTransactions(params)
        const items: TransactionItem[] = res.data?.items ?? []
        const mapped = items.map(mapTransactionType)
        transactions.value = reset ? mapped : [...transactions.value, ...mapped]
        nextCursor.value = res.data?.nextCursor ?? null
        hasNext.value = Boolean(res.data?.hasNext)
        totalCount.value = res.data?.totalCount ?? transactions.value.length
      } catch (e) {
        console.error(e)
        error.value = '거래를 불러오지 못했습니다.'
      } finally {
        loading.value = false
        loadingMore.value = false
      }
    }

    const applyFilters = async () => {
      error.value = ''
      if (!validateRange()) return
      await Promise.all([loadSummary(), loadTransactions(true)])
    }

    const setupObserver = () => {
      if (observer) {
        observer.disconnect()
      }
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry.isIntersecting && hasNext.value && !loading.value && !loadingMore.value) {
            loadTransactions(false)
          }
        },
        { threshold: 1 },
      )

      if (sentinel.value) {
        observer.observe(sentinel.value)
      }
    }

    const goDetail = (id: number) => router.push({ name: 'TransactionDetail', params: { transactionId: id } })

    onMounted(async () => {
      await applyFilters()
      setupObserver()
    })

    onBeforeUnmount(() => {
      if (observer) observer.disconnect()
    })

    return {
      filters,
      summary,
      transactions,
      totalCount,
      loading,
      loadingMore,
      error,
      rangeLabel,
      sentinel,
      applyFilters,
      formatCurrency,
      formatDate,
      amountPrefix,
      amountClass,
      goDetail,
    }
  },
})
</script>
