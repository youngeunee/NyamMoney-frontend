<template>
  <Layout>
    <div class="p-6 space-y-6 max-w-3xl mx-auto">
      <PageHeader title="챌린지 생성" description="새로운 챌린지를 등록하세요." />

      <button
        class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        @click="goBack"
        type="button"
      >
        ← 목록으로
      </button>

      <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">제목</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">설명</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">시작일</label>
              <input
                v-model="form.startDate"
                type="date"
                required
                :min="minStartDate"
                class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">종료일</label>
              <input
                v-model="form.endDate"
                type="date"
                required
                :min="minEndDate"
                class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">예산</label>
            <input
              v-model.number="form.budgetLimit"
              type="number"
              required
              min="0"
              class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-md border border-border text-sm font-semibold text-foreground hover:bg-accent transition"
              @click="goBack"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              챌린지 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  </Layout>
</template>

<script>
import { reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge.store'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  components: { Layout, PageHeader },

  setup() {
    const router = useRouter()
    const store = useChallengeStore()
    const { creating } = storeToRefs(store)

    const form = reactive({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      budgetLimit: null,
    })

    const minStartDate = computed(() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().slice(0, 10)
    })

    const minEndDate = computed(() => {
      const base = form.startDate ? new Date(form.startDate) : new Date(minStartDate.value)
      return base.toISOString().slice(0, 10)
    })

    watch(
      () => form.startDate,
      (val) => {
        if (!val) return
        if (!form.endDate || form.endDate < val) {
          form.endDate = val
        }
      }
    )

    const handleSubmit = async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        startDate: form.startDate,
        endDate: form.endDate,
        budgetLimit: form.budgetLimit,
      }

      const challengeId = await store.createChallenge(payload)

      // 생성 후 상세 페이지 이동
      router.push({
        name: 'challengeDetail',
        params: { challengeId },
      })
    }

    const goBack = () => {
      router.push({ name: 'challengeList'})
    }

    return {
      form,
      handleSubmit,
      creating, goBack,
      minStartDate,
      minEndDate,
    }
  },
}
</script>
