<template>
  <div class="p-4 rounded-md border border-border bg-card">
    <p v-if="label" class="text-xs text-muted-foreground mb-2">{{ label }}</p>
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-2 leading-tight">
      <div class="flex items-baseline gap-1 min-w-0">
        <span class="text-[11px] text-muted-foreground shrink-0">총 지출</span>
        <span class="text-xl font-semibold text-primary truncate max-w-[110px]">{{ expenseText }}</span>
        <span class="text-sm font-semibold text-primary shrink-0">원</span>
      </div>
      <span class="text-muted-foreground text-xs shrink-0">/</span>
      <div class="flex items-baseline gap-1 min-w-0">
        <span class="text-[11px] text-muted-foreground shrink-0">총 수입</span>
        <span class="text-xl font-semibold text-foreground truncate max-w-[110px]">{{ incomeText }}</span>
        <span class="text-sm font-semibold text-foreground shrink-0">원</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'ExpenseIncomeSummary',
  props: {
    label: {
      type: String,
      default: '',
    },
    expense: {
      type: Number,
      default: 0,
    },
    income: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const format = (value?: number) => (value ?? 0).toLocaleString('ko-KR')
    const expenseText = computed(() => format(props.expense))
    const incomeText = computed(() => format(props.income))

    return {
      expenseText,
      incomeText,
    }
  },
})
</script>
