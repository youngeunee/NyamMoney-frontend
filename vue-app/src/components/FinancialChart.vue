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
    <div v-if="hasData" class="h-[240px] w-full relative">
      <svg :viewBox="`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`" preserveAspectRatio="xMidYMid meet" class="w-full h-full">
        <defs>
          <mask id="expense-mask">
            <rect :width="SVG_WIDTH" :height="SVG_HEIGHT" fill="white" />
            <polygon v-if="impulseAreaPoints" :points="impulseAreaPoints" fill="black" />
          </mask>
        </defs>
        <!-- grid + y축 -->
        <g v-for="tick in yTicks" :key="tick.value" stroke="#eee">
          <line
            :y1="tick.y"
            :y2="tick.y"
            :x1="PADDING_LEFT"
            :x2="SVG_WIDTH - PADDING_RIGHT"
          />
          <text
            :x="PADDING_LEFT - 8"
            :y="tick.y + 4"
            text-anchor="end"
            class="text-[10px]"
            fill="#666"
          >
            {{ tick.label }}
          </text>
        </g>

        <!-- expense area -->
        <polygon
          :points="expenseAreaPoints"
          fill="hsl(var(--secondary))"
          fill-opacity="0.12"
          stroke="none"
          mask="url(#expense-mask)"
        />
        <!-- impulse area -->
        <polygon :points="impulseAreaPoints" fill="hsl(var(--primary))" fill-opacity="0.12" stroke="none"/>

        <!-- expense line -->
        <polyline :points="expensePoints" fill="none" stroke="hsl(var(--secondary))" stroke-width="1" />
        <!-- impulse line -->
        <polyline :points="impulsePoints" fill="none" stroke="hsl(var(--primary))" stroke-width="1" />

        <!-- hover guide -->
        <g v-if="hover.active">
          <line
            :x1="hover.x"
            :x2="hover.x"
            :y1="PADDING_TOP"
            :y2="SVG_HEIGHT - PADDING_BOTTOM"
            stroke="hsl(var(--border))"
            stroke-dasharray="4 3"
          />
          <circle :cx="hover.x" :cy="hover.expenseY" r="3" fill="hsl(var(--secondary))" />
          <circle :cx="hover.x" :cy="hover.impulseY" r="3" fill="hsl(var(--primary))" />
        </g>

        <!-- labels -->
        <g class="text-[10px]" fill="#666">
          <text
            v-for="(d, i) in normalizedData"
            :key="`${d.label}-${i}`"
            :x="labelX(i)"
            :y="SVG_HEIGHT - 8"
            text-anchor="middle"
          >
            {{ d.label }}
          </text>
        </g>

        <!-- event capture -->
        <rect
          :x="PADDING_LEFT"
          :y="PADDING_TOP"
          :width="axisWidth"
          :height="axisHeight"
          fill="transparent"
          @mousemove="onChartHover"
          @mouseleave="clearHover"
        />
      </svg>
      <div
        v-if="tooltip.visible"
        class="absolute z-10 rounded-md bg-card border border-border px-3 py-2 text-xs shadow-sm"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="font-semibold">{{ tooltip.label }}</div>
        <div class="text-muted-foreground">지출 {{ formatCurrency(tooltip.expense) }}원</div>
        <div class="text-primary">시발비용 {{ formatCurrency(tooltip.impulse) }}원</div>
      </div>
    </div>
    <div v-else class="h-[240px] w-full flex items-center justify-center text-sm text-muted-foreground">
      표시할 데이터가 없습니다.
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from 'vue'

type ChartPoint = {
  label: string
  expense?: number
  impulse?: number
  income?: number
}

const SVG_WIDTH = 600
const SVG_HEIGHT = 220
const PADDING_LEFT = 48
const PADDING_RIGHT = 20
const PADDING_BOTTOM = 30
const PADDING_TOP = 10
const GRID_LINES = 5
const formatCurrency = (value?: number) => (value ?? 0).toLocaleString('ko-KR')

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
    const hoverState = reactive({
      active: false,
      index: -1,
      tooltipX: 0,
      tooltipY: 0,
    })

    const expenseMax = computed(() => {
      if (!hasData.value) return 0
      return Math.max(...normalizedData.value.map((d) => d.expense ?? 0), 0)
    })

    const axisMax = computed(() => {
      const raw = expenseMax.value
      const ceiled = Math.ceil(raw / 10000) * 10000
      if (ceiled > 0) return ceiled
      return 10000
    })

    const axisHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const axisWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT

    const yTicks = computed(() => {
      const ticks = []
      for (let i = 0; i < GRID_LINES; i += 1) {
        const ratio = i / (GRID_LINES - 1)
        const value = Math.round(axisMax.value * (1 - ratio))
        ticks.push({
          value,
          label: value.toLocaleString('ko-KR'),
          y: PADDING_TOP + axisHeight * ratio,
        })
      }
      return ticks
    })

    const step = computed(() => {
      const count = normalizedData.value.length
      return count > 1 ? axisWidth / (count - 1) : 0
    })

    const pointCoord = (index: number, key: keyof ChartPoint) => {
      const val = (normalizedData.value[index]?.[key] as number | undefined) ?? 0
      const x = PADDING_LEFT + step.value * index
      const y = PADDING_TOP + axisHeight - ((val / axisMax.value) * axisHeight || 0)
      return { x, y }
    }

    const mapPoints = (key: keyof ChartPoint) =>
      normalizedData.value
        .map((_, i) => pointCoord(i, key))
        .map(({ x, y }) => `${x},${y}`)
        .join(' ')

    const expensePoints = computed(() => mapPoints('expense'))
    const impulsePoints = computed(() => mapPoints('impulse'))

    const buildArea = (polyline: string) => {
      if (!polyline) return ''
      const pts = polyline.split(' ').filter(Boolean)
      if (!pts.length) return ''
      const first = pts[0]
      const last = pts[pts.length - 1]
      const baseY = PADDING_TOP + axisHeight
      return [first, ...pts, `${last.split(',')[0]},${baseY}`, `${first.split(',')[0]},${baseY}`].join(' ')
    }

    const expenseAreaPoints = computed(() => buildArea(expensePoints.value))
    const impulseAreaPoints = computed(() => buildArea(impulsePoints.value))
    const labelX = (index: number) => PADDING_LEFT + step.value * index

    const dailyValue = (index: number, key: keyof ChartPoint) => {
      const current = (normalizedData.value[index]?.[key] as number | undefined) ?? 0
      const prev = index > 0 ? (normalizedData.value[index - 1]?.[key] as number | undefined) ?? 0 : 0
      return current - prev
    }

    const hover = computed(() => {
      if (!hoverState.active || hoverState.index < 0) return { active: false, x: 0, expenseY: 0, impulseY: 0 }
      const x = labelX(hoverState.index)
      const expenseY = pointCoord(hoverState.index, 'expense').y
      const impulseY = pointCoord(hoverState.index, 'impulse').y
      return { active: true, x, expenseY, impulseY }
    })

    const tooltip = computed(() => {
      if (!hoverState.active || hoverState.index < 0) return { visible: false, x: 0, y: 0, label: '', expense: 0, impulse: 0 }
      return {
        visible: true,
        x: hoverState.tooltipX,
        y: hoverState.tooltipY,
        label: normalizedData.value[hoverState.index]?.label ?? '',
        expense: dailyValue(hoverState.index, 'expense'),
        impulse: dailyValue(hoverState.index, 'impulse'),
      }
    })

    const onChartHover = (event: MouseEvent) => {
      if (!normalizedData.value.length) return
      const svg = (event.currentTarget as SVGRectElement)?.ownerSVGElement
      const rect = svg?.getBoundingClientRect()
      if (!rect) return
      const viewX = ((event.clientX - rect.left) / rect.width) * SVG_WIDTH
      if (viewX < PADDING_LEFT || viewX > SVG_WIDTH - PADDING_RIGHT) {
        clearHover()
        return
      }
      const rawIndex = step.value
        ? Math.round((viewX - PADDING_LEFT) / step.value)
        : 0
      const index = Math.min(Math.max(rawIndex, 0), normalizedData.value.length - 1)
      const tooltipX = event.clientX - rect.left + 10
      const tooltipY = event.clientY - rect.top + 10
      hoverState.active = true
      hoverState.index = index
      hoverState.tooltipX = tooltipX
      hoverState.tooltipY = tooltipY
    }

    const clearHover = () => {
      hoverState.active = false
      hoverState.index = -1
    }

    return {
      normalizedData,
      hasData,
      expensePoints,
      impulsePoints,
      expenseAreaPoints,
      impulseAreaPoints,
      labelX,
      SVG_WIDTH,
      SVG_HEIGHT,
      PADDING_LEFT,
      PADDING_RIGHT,
      yTicks,
      axisWidth,
      axisHeight,
      hover,
      tooltip,
      onChartHover,
      clearHover,
      formatCurrency,
    }
  },
})
</script>
