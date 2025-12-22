<template>
  <Layout>
    <div class="p-6 max-w-3xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">거래 수정</h1>
          <p class="text-sm text-muted-foreground">필드를 변경해 저장하세요.</p>
        </div>
        <button
          class="text-sm text-muted-foreground hover:text-foreground underline"
          @click="goDetail"
          type="button"
        >
          상세로 돌아가기
        </button>
      </div>

      <UiCard wrapperClass="border border-border bg-card">
        <div class="p-4 space-y-4">
          <div v-if="loading" class="text-center text-muted-foreground">
            <UiSpinner />
          </div>

          <div v-else class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">거래 유형</span>
                <select v-model="form.txType" class="w-full border border-border rounded-md p-2 bg-background">
                  <option value="EXPENSE">지출</option>
                  <option value="INCOME">수입</option>
                  <option value="TRANSFER">이체</option>
                </select>
              </label>

              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">금액</span>
                <input
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  class="w-full border border-border rounded-md p-2 bg-background"
                  placeholder="예: 15000"
                />
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">사용일시</span>
                <input
                  v-model="form.occurredAt"
                  type="datetime-local"
                  class="w-full border border-border rounded-md p-2 bg-background"
                />
              </label>

              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">카테고리</span>
                <select
                  v-model.number="form.categoryId"
                  class="w-full border border-border rounded-md p-2 bg-background"
                >
                  <option
                    v-for="cat in categories"
                    :key="cat.id"
                    :value="cat.id"
                  >
                    {{ cat.label }}
                  </option>
                </select>
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">가맹점</span>
                <input
                  v-model="form.merchantName"
                  type="text"
                  class="w-full border border-border rounded-md p-2 bg-background"
                  placeholder="가맹점 또는 메모"
                />
              </label>

              <label class="space-y-1 text-sm">
                <span class="text-muted-foreground">메모</span>
                <input
                  v-model="form.memo"
                  type="text"
                  class="w-full border border-border rounded-md p-2 bg-background"
                  placeholder="메모 (선택)"
                />
              </label>
            </div>

            <div class="flex flex-wrap gap-4 text-sm">
              <label class="inline-flex items-center gap-2">
                <input v-model="form.impulseFlag" type="checkbox" class="accent-primary" />
                <span>시발비용</span>
              </label>
              <label class="inline-flex items-center gap-2">
                <input v-model="form.isRefund" type="checkbox" class="accent-primary" />
                <span>환불</span>
              </label>
              <button
                class="px-3 py-2 rounded-md border border-border hover:bg-accent transition"
                type="button"
                @click="classifyCategory"
              >
                카테고리 자동 분류
              </button>
            </div>

            <div class="flex items-center justify-between">
              <button
                class="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition"
                type="button"
                @click="goDetail"
              >
                취소
              </button>
              <button
                class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                type="button"
                :disabled="loading"
                @click="submit"
              >
                {{ loading ? '수정 중...' : '저장' }}
              </button>
            </div>

            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            <p v-if="success" class="text-sm text-green-600">수정되었습니다. 상세 페이지로 이동합니다.</p>
          </div>
        </div>
      </UiCard>
    </div>
  </Layout>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import { classifyTransactionCategory, fetchTransactionDetail, updateTransaction } from '@/services/transaction.service'

export default defineComponent({
  name: 'TransactionEditView',
  components: { Layout, UiCard, UiSpinner },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const transactionId = Number(route.params.transactionId)
    const loading = ref(false)
    const error = ref('')
    const success = ref(false)
    const categories = [
      { id: 1, label: '식사' },
      { id: 2, label: '카페·간식' },
      { id: 3, label: '쇼핑' },
      { id: 4, label: '이동·차량' },
      { id: 5, label: '주거·생활요금' },
      { id: 6, label: '건강·의료' },
      { id: 7, label: '교육' },
      { id: 8, label: '여가·취미' },
      { id: 9, label: '금융' },
      { id: 10, label: '기타' },
    ]
    const form = reactive({
      txType: 'EXPENSE',
      amount: null as number | null,
      occurredAt: '',
      categoryId: categories[0].id,
      merchantName: '',
      memo: '',
      impulseFlag: false,
      isRefund: false,
    })

    const toLocalInput = (dateString?: string) => {
      if (!dateString) return ''
      const d = new Date(dateString)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes(),
      )}`
    }

    const loadDetail = async () => {
      loading.value = true
      error.value = ''
      try {
        const res = await fetchTransactionDetail(transactionId)
        const dt = res.data
        form.txType = dt.txType || 'EXPENSE'
        form.amount = dt.amount ?? 0
        form.occurredAt = toLocalInput(dt.occurredAt) || ''
        form.categoryId = dt.category?.categoryId ?? form.categoryId
        form.merchantName = dt.merchantName || dt.merchantNameRaw || ''
        form.memo = dt.memo || ''
        form.impulseFlag = Boolean(dt.impulseFlag)
        form.isRefund = Boolean(dt.isRefund)
      } catch (e) {
        console.error(e)
        error.value = '거래 정보를 불러오지 못했습니다.'
      } finally {
        loading.value = false
      }
    }

    const formatForApi = () => {
      if (!form.amount || !form.occurredAt || !form.categoryId) {
        throw new Error('필수 항목을 모두 입력하세요.')
      }
      return {
        txType: form.txType,
        amount: Number(form.amount),
        occurredAt: form.occurredAt,
        categoryId: Number(form.categoryId),
        merchantNameRaw: form.merchantName || null,
        memo: form.memo || null,
        impulseFlag: Boolean(form.impulseFlag),
        isRefund: Boolean(form.isRefund),
      }
    }

    const classifyCategory = async () => {
      error.value = ''
      try {
        if (!form.merchantName) {
          throw new Error('가맹점을 입력한 뒤 분류를 시도하세요.')
        }
        const res = await classifyTransactionCategory({
          merchantName: form.merchantName,
          allowAi: true,
        })
        const catId = res.data?.categoryId
        if (catId) {
          form.categoryId = Number(catId)
        }
      } catch (e: any) {
        console.error(e)
        error.value = e?.message || '자동 분류에 실패했습니다.'
      }
    }

    const submit = async () => {
      error.value = ''
      success.value = false
      try {
        const payload = formatForApi()
        loading.value = true
        await updateTransaction(transactionId, payload)
        success.value = true
        setTimeout(goDetail, 500)
      } catch (e: any) {
        console.error(e)
        error.value = e?.message || '수정에 실패했습니다.'
      } finally {
        loading.value = false
      }
    }

    const goDetail = () => router.push({ name: 'TransactionDetail', params: { transactionId } })

    onMounted(loadDetail)

    return {
      transactionId,
      form,
      categories,
      loading,
      error,
      success,
      submit,
      goDetail,
      classifyCategory,
    }
  },
})
</script>
