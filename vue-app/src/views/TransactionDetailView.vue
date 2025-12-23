<template>
  <Layout>
    <div class="p-6 max-w-3xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-muted-foreground">거래 상세</p>
          <h1 class="text-2xl font-bold">상세 내역 보기</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-2 rounded-md border border-border text-sm hover:bg-accent transition"
            type="button"
            @click="goBack"
          >
            돌아가기
          </button>
          <button
            class="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            type="button"
            @click="goEdit"
          >
            수정하기
          </button>
          <button
            class="px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            type="button"
            :disabled="deleting || loading"
            @click="handleDelete"
          >
            삭제하기
          </button>
        </div>
      </div>

      <UiCard wrapperClass="border border-border bg-card">
        <template #header>
          <div class="px-4 pt-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-muted-foreground">가맹점</p>
              <p class="text-lg font-semibold">{{ detail?.merchantName || detail?.merchantNameRaw || '거래' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="detail?.impulseFlag" class="px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                시발비용
              </span>
              <span v-if="detail?.isRefund" class="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold">
                환불
              </span>
            </div>
          </div>
        </template>

        <div v-if="loading" class="p-6 text-center text-muted-foreground">
          <UiSpinner />
        </div>
        <div v-else-if="error" class="p-6 text-red-500 text-sm">
          {{ error }}
        </div>
        <div v-else-if="!detail" class="p-6 text-muted-foreground text-sm">
          데이터를 불러올 수 없습니다.
        </div>
        <div v-else class="divide-y divide-border">
          <div class="p-4 grid gap-3 md:grid-cols-2">
            <div>
              <p class="text-xs text-muted-foreground">금액</p>
              <p :class="['text-xl font-semibold', detail.isRefund ? 'text-primary' : 'text-secondary']">
                {{ amountPrefix(detail) }}{{ formatCurrency(detail.amount) }}원
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">거래일시</p>
              <p class="text-sm font-medium">{{ formatDate(detail.occurredAt) }}</p>
            </div>
          </div>

          <div class="p-4 grid gap-3 md:grid-cols-2">
            <div>
              <p class="text-xs text-muted-foreground">카테고리</p>
              <p class="text-sm font-medium">{{ detail.category?.name || '카테고리 없음' }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">결제수단</p>
              <p class="text-sm font-medium">{{ detail.paymentMethod || '정보 없음' }}</p>
            </div>
          </div>

          <div class="p-4 space-y-2">
            <p class="text-xs text-muted-foreground">메모</p>
            <p class="text-sm text-foreground whitespace-pre-line">
              {{ detail.memo || '메모 없음' }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>
  </Layout>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import { deleteTransaction, fetchTransactionDetail } from '@/services/transaction.service'

export default defineComponent({
  name: 'TransactionDetailView',
  components: { Layout, UiCard, UiSpinner },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const transactionId = Number(route.params.transactionId)
    const loading = ref(false)
    const deleting = ref(false)
    const error = ref('')
    const detail = ref<any | null>(null)

    const formatCurrency = (value?: number) => (value ?? 0).toLocaleString('ko-KR')
    const formatDate = (value?: string) => {
      if (!value) return ''
      const d = new Date(value)
      return d.toLocaleString('ko-KR')
    }
    const amountPrefix = (tx: any) => {
      const rawType = (tx?.transactionType || tx?.type || '').toString().toLowerCase()
      if (tx?.isRefund || rawType === 'income') return '+'
      return '-'
    }

    const load = async () => {
      loading.value = true
      error.value = ''
      try {
        const res = await fetchTransactionDetail(transactionId)
        detail.value = res.data
      } catch (e) {
        console.error(e)
        error.value = '거래 상세를 불러오지 못했습니다.'
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async () => {
      if (!confirm('거래를 삭제하시겠습니까?')) return
      deleting.value = true
      error.value = ''
      try {
        await deleteTransaction(transactionId)
        router.push({ name: 'Analytics' })
      } catch (e) {
        console.error(e)
        error.value = '거래를 삭제하지 못했습니다.'
      } finally {
        deleting.value = false
      }
    }

    const goBack = () => router.push({ name: 'Analytics' })
    const goEdit = () => router.push({ name: 'TransactionEdit', params: { transactionId } })

    onMounted(load)

    return {
      transactionId,
      loading,
      deleting,
      error,
      detail,
      formatCurrency,
      formatDate,
      amountPrefix,
      goBack,
      goEdit,
      handleDelete,
    }
  },
})
</script>
