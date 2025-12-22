<template>
  <div class="shadow-sm border-border/50 border rounded-md bg-card p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-foreground">최근 거래</h3>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-6">
      <UiSpinner />
    </div>

    <div v-else-if="displayed.length === 0" class="text-center text-sm text-muted-foreground py-6">
      최근 거래가 없습니다.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="transaction in displayed"
        :key="transaction.transactionId"
        class="flex items-center p-2 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div class="flex-1">
          <p class="text-sm font-medium text-foreground">
            {{ transaction.merchantNameRaw || '거래' }}
          </p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ formatDate(transaction.occurredAt) }}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <span :class="['text-sm font-semibold', amountClass(transaction.type)]">
            {{ amountPrefix(transaction.type) }}{{ formatAmount(transaction.amount) }}원
          </span>
          <span class="h-4 w-4">
            {{ transaction.type === 'refund' ? '⬆️' : '⬇️' }}
          </span>
        </div>
      </div>
    </div>

    <button
      class="w-full mt-4 shadow-sm bg-transparent border border-border rounded-md py-2"
      @click="$emit('viewAll')"
    >
      전체 거래 보기
    </button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import UiSpinner from './ui/Spinner.vue'

type TransactionDisplay = {
  transactionId: number
  occurredAt?: string
  amount?: number
  merchantNameRaw?: string
  type?: 'expense' | 'refund' | 'income'
}

export default defineComponent({
  name: 'RecentTransactions',
  components: { UiSpinner },
  emits: ['viewAll'],
  props: {
    transactions: {
      type: Array as () => TransactionDisplay[],
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    limit: {
      type: Number,
      default: 5,
    },
  },
  setup(props) {
    const displayed = computed(() => props.transactions.slice(0, props.limit))

    const formatDate = (date?: string) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
    }

    const formatAmount = (amount?: number) => {
      if (amount === null || amount === undefined) return '-'
      return amount.toLocaleString('ko-KR')
    }

    const amountClass = (type?: string) => {
      return type === 'refund' || type === 'income' ? 'text-primary' : 'text-secondary'
    }

    const amountPrefix = (type?: string) => {
      return type === 'refund' || type === 'income' ? '+' : '-'
    }

    return {
      displayed,
      formatDate,
      formatAmount,
      amountClass,
      amountPrefix,
    }
  },
})
</script>
