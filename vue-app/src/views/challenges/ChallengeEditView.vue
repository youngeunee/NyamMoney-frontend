<template>
  <Layout>
    <div class="p-6 space-y-6 max-w-3xl mx-auto">
      <PageHeader title="챌린지 수정" description="챌린지 내용을 수정하세요." />

      <button
        class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        type="button"
        @click="goBack"
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
                :min="minStartDate"
                class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">종료일</label>
              <input
                v-model="form.endDate"
                type="date"
                :min="minEndDate"
                class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
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
              :disabled="updating"
              class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              수정 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  </Layout>
</template>

<script>
import { reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChallengeStore } from '@/stores/challenge.store'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  components: { Layout, PageHeader },

  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useChallengeStore()
    const { challengeDetail, updating } = storeToRefs(store)

    const challengeId = route.params.challengeId

    const form = reactive({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
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

    onMounted(async () => {
      if (!store.challengeDetail) {
        await store.loadChallengeDetail(challengeId)
      }

      const c = store.challengeDetail
      form.title = c.title
      form.description = c.description
      form.startDate = c.startDate
      form.endDate = c.endDate
    })

    const handleSubmit = async () => {
      const payload = {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
      }

      if (form.title) payload.title = form.title
      if (form.description) payload.description = form.description
      if (form.startDate) payload.startDate = form.startDate
      if (form.endDate) payload.endDate = form.endDate

      await store.updateChallenge(challengeId, payload)

      // 수정 후 상세로
      router.replace({
        name: 'challengeDetail',
        params: { challengeId },
      })
    }

    const goBack = () => {
      router.push({ name: 'challengeList' })
    }

    return {
      form,
      handleSubmit,
      updating,
      minStartDate,
      minEndDate,
      goBack,
    }
  },
}
</script>
