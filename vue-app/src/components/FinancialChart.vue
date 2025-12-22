<template>
  <div class="border border-border rounded-md bg-card p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-medium">지출 추이</h3>
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <span class="inline-block h-2 w-2 rounded-full bg-secondary"></span>
          <span>지출</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="inline-block h-2 w-2 rounded-full bg-primary"></span>
          <span>시발비용</span>
        </div>
      </div>
    </div>
    <div v-if="hasData" class="h-[240px] w-full">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" class="w-full h-full">
        <!-- grid lines -->
        <g stroke="#eee">
          <line v-for="i in 5" :key="i" :y1="(i-1)*50" :y2="(i-1)*50" x1="0" x2="600" />
        </g>

        <!-- expense line -->
        <polyline :points="expensePoints" fill="none" stroke="#f97316" stroke-width="2" />
        <!-- impulse line -->
        <polyline :points="impulsePoints" fill="none" stroke="#3b82f6" stroke-width="2" />

        <!-- labels -->
        <g class="text-[10px]" fill="#666">
          <text
            v-for="(d, i) in normalizedData"
            :key="`${d.label}-${i}`"
            :x="labelX(i)"
            y="210"
            text-anchor="middle"
          >
            {{ d.label }}
          </text>
        </g>
      </svg>
    </div>
    <div v-else class="h-[240px] w-full flex items-center justify-center text-sm text-muted-foreground">
      표시할 데이터가 없습니다.
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

type ChartPoint = {
  label: string
  expense?: number
  impulse?: number
  income?: number
}

const WIDTH = 600
const HEIGHT = 200
const PADDING_X = 20
const PADDING_BOTTOM = 30
const PADDING_TOP = 10

export default defineComponent({
  name: 'FinancialChart',
  props: {
    data: {
      type: Array as () => ChartPoint[],
      default: () => [],
    },
  },
  setup(props) {
    const normalizedData = computed<ChartPoint[]>(() => props.data ?? [])
    const hasData = computed(() => normalizedData.value.length > 0)

    const maxValue = computed(() => {
      if (!hasData.value) return 1
      const values = normalizedData.value.flatMap((d) => [
        d.expense ?? 0,
        d.impulse ?? 0,
        d.income ?? 0,
      ])
      return Math.max(...values, 1)
    })

    const step = computed(() => {
      const count = normalizedData.value.length
      return count > 1 ? (WIDTH - PADDING_X * 2) / (count - 1) : 0
    })

    const mapPoints = (key: keyof ChartPoint) => {
      const points = normalizedData.value.map((d, i) => {
        const val = (d[key] as number | undefined) ?? 0
        const x = PADDING_X + step.value * i
        const y =
          HEIGHT - PADDING_BOTTOM -
          ((val / maxValue.value) * (HEIGHT - PADDING_TOP - PADDING_BOTTOM))
        return `${x},${y}`
      })
      return points.join(' ')
    }

    const expensePoints = computed(() => mapPoints('expense'))
    const impulsePoints = computed(() => mapPoints('impulse'))
    const labelX = (index: number) => PADDING_X + step.value * index

    return {
      normalizedData,
      hasData,
      expensePoints,
      impulsePoints,
      labelX,
    }
  },
})
</script>
