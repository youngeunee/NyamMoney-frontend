<template>
  <div class="p-4 rounded-md border border-border bg-card">
    <p v-if="label" class="text-xs text-muted-foreground mb-2">{{ label }}</p>
    <div class="flex items-baseline gap-3">
      <div class="flex items-baseline gap-1">
        <span class="text-[11px] text-muted-foreground">총 지출</span>
        <span class="text-xl font-semibold text-secondary">{{ expenseText }}원</span>
      </div>
      <span class="text-muted-foreground text-xs">/</span>
      <div class="flex items-baseline gap-1">
        <span class="text-[11px] text-muted-foreground">총 수입</span>
        <span class="text-xl font-semibold text-primary">{{ incomeText }}원</span>
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
