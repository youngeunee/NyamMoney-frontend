<template>
  <Layout>
    <div class="p-6 max-w-3xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">소비내역 등록</h1>
          <p class="text-sm text-muted-foreground">거래 정보를 입력하고 등록하세요.</p>
        </div>
        <button
          class="text-sm text-muted-foreground hover:text-foreground underline"
          @click="goAnalytics"
          type="button"
        >
          거래 내역으로 이동
        </button>
      </div>

      <UiCard wrapperClass="border border-border bg-card">
        <div class="p-4 space-y-4">
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
              <span>냠비용</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input v-model="form.isRefund" type="checkbox" class="accent-primary" />
              <span>환불</span>
            </label>
            <button
              class="px-3 py-2 rounded-md border border-border hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              :disabled="classifyLoading"
              @click="classifyCategory"
            >
              {{ classifyLoading ? '분류 중...' : '카테고리 자동 분류' }}
            </button>
          </div>

          <div class="flex items-center justify-between">
            <button
              class="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition"
              type="button"
              @click="goBack"
            >
              취소
            </button>
            <button
              class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              type="button"
              :disabled="loading"
              @click="submit"
            >
              {{ loading ? '등록 중...' : '등록' }}
            </button>
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600">등록되었습니다. 거래 내역으로 이동합니다.</p>
        </div>
      </UiCard>
    </div>
  </Layout>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/Layout.vue'
import UiCard from '@/components/ui/Card.vue'
import { classifyTransactionCategory, createTransaction } from '@/services/transaction.service'

export default defineComponent({
  name: 'TransactionCreateView',
  components: { Layout, UiCard },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const classifyLoading = ref(false)
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
      occurredAt: new Date().toISOString().slice(0, 16),
      categoryId: categories[0].id,
      merchantName: '',
      memo: '',
      impulseFlag: false,
      isRefund: false,
    })

    const formatForApi = () => {
      if (!form.amount || !form.occurredAt || !form.categoryId) {
        throw new Error('필수 항목을 모두 입력하세요.')
      }
      return {
        txType: form.txType,
        amount: Number(form.amount),
        occurredAt: form.occurredAt,
        categoryId: Number(form.categoryId),
        merchantName: form.merchantName || null,
        memo: form.memo || null,
        impulseFlag: Boolean(form.impulseFlag),
        isRefund: Boolean(form.isRefund),
      }
    }

    const classifyCategory = async () => {
      if (classifyLoading.value) return
      error.value = ''
      classifyLoading.value = true
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
      } finally {
        classifyLoading.value = false
      }
    }

    const submit = async () => {
      if (loading.value) return
      error.value = ''
      success.value = false
      try {
        const payload = formatForApi()
        loading.value = true
        await createTransaction(payload)
        success.value = true
        setTimeout(() => router.push({ name: 'Analytics' }), 500)
      } catch (e: any) {
        console.error(e)
        error.value = e?.message || '등록에 실패했습니다.'
      } finally {
        loading.value = false
      }
    }

    const goAnalytics = () => router.push({ name: 'Analytics' })
    const goBack = () => router.back()

    return {
      form,
      loading,
      classifyLoading,
      error,
      success,
      submit,
      goAnalytics,
      goBack,
      categories,
      classifyCategory,
    }
  },
})
</script>
