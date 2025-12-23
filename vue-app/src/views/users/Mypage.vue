<template>
  <Layout>
    <div class="p-6 space-y-6 max-w-5xl mx-auto">
      <PageHeader title="My Page" description="내 프로필과 설정을 관리하세요." />

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <template v-for="(t, idx) in tabs" :key="t.value">
            <span v-if="idx > 0" class="text-muted-foreground">|</span>
            <button
              @click="tab = t.value"
              :class="[
                'px-2 py-1 rounded transition-colors',
                tab === t.value ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
              ]"
              type="button"
            >
              {{ t.label }}
            </button>
          </template>
        </div>

        <!-- =======================
             Account
        ======================== -->
        <div v-if="tab === 'account'">
          <div class="border border-border rounded-md bg-card p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-foreground">내 정보</h2>

            <div class="space-y-6 mt-4">
              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">아이디</label>
                <UiInput v-model="local.loginId" readonly />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">닉네임</label>
                <UiInput v-model="local.nickname" @input="onNicknameInput" />
                <p
                  v-if="nicknameCheck.message || nicknameCheck.loading"
                  class="text-xs mt-1"
                  :class="nicknameCheck.available ? 'text-green-600' : 'text-red-500'"
                >
                  {{ nicknameCheck.loading ? '닉네임 확인 중...' : nicknameCheck.message }}
                </p>
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">이름</label>
                <UiInput v-model="local.name" />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">휴대폰 번호</label>
                <UiInput v-model="local.phoneNumber" type="tel" placeholder="010-1234-5678" />
                <p v-if="phoneError" class="text-xs text-red-500">{{ phoneError }}</p>
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">이메일</label>
                <UiInput v-model="local.email" type="email" />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">Profile Visibility</label>
                <div class="flex gap-4">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="PUBLIC"
                      v-model="local.profileVisibility"
                      class="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span class="text-sm font-medium">Public</span>
                  </label>

                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="PROTECTED"
                      v-model="local.profileVisibility"
                      class="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span class="text-sm font-medium">Protected</span>
                  </label>
                </div>
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">한 달 예산</label>
                <UiInput v-model="local.monthlyBudget" type="number" />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">냠 비용</label>
                <UiInput v-model="local.triggerBudget" type="number" />
              </div>

              <!-- 버튼 영역: 가로 배치 -->
              <div class="flex justify-end gap-2 mt-4">
                <button
                  @click="saveAccount"
                  class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                  :disabled="saving"
                >
                  {{ saving ? '저장 중...' : '수정하기' }}
                </button>

                <button
                  @click="handleDeleteAccount"
                  class="px-4 py-2 rounded-md border border-border text-sm font-semibold text-foreground hover:bg-accent transition"
                  :disabled="deleting"
                >
                  {{ deleting ? '탈퇴 중...' : '탈퇴하기' }}
                </button>
              </div>
            </div>
          </div>

          <UiCard wrapperClass="border border-border">
            <template #header>
              <div class="px-4 pt-4 flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">이번 달 예산 사용률</p>
                  <p class="text-sm font-semibold">소비 & 시발비용</p>
                </div>
                <div v-if="summaryLoading" class="text-xs text-muted-foreground flex items-center gap-2">
                  <UiSpinner /> 불러오는 중
                </div>
              </div>
            </template>

            <div v-if="!summaryLoading" class="p-4 space-y-6">
              <div class="grid gap-6 md:grid-cols-2">
                <div class="flex items-center gap-4">
                  <div class="relative inline-block donut-wrapper">
                    <svg viewBox="0 0 36 36" class="h-32 w-32">
                      <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#fed253"
                        stroke-width="6"
                        stroke-linecap="butt"
                        :stroke-dasharray="`${impulseUsageCap} ${100 - impulseUsageCap}`"
                        stroke-dashoffset="25"
                      />
                      <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                      <text x="18" y="19" text-anchor="middle" class="fill-current text-foreground" font-size="7" font-weight="700">
                        {{ Math.round(impulseUsage) }}%
                      </text>
                    </svg>
                  </div>
                  <div class="space-y-1 text-sm">
                    <p class="font-semibold text-foreground">이번 달 시발비용</p>
                    <p class="text-muted-foreground">
                      {{ formatCurrency(monthlyImpulseAmount) }}원 / {{ formatCurrency(triggerBudget || 0) }}원
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="relative inline-block donut-wrapper">
                    <svg viewBox="0 0 36 36" class="h-32 w-32">
                      <circle cx="18" cy="18" r="15" fill="hsl(var(--card))" stroke="hsl(var(--muted))" stroke-width="6" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#fed253"
                        stroke-width="6"
                        stroke-linecap="butt"
                        :stroke-dasharray="`${expenseUsageCap} ${100 - expenseUsageCap}`"
                        stroke-dashoffset="25"
                      />
                      <circle cx="18" cy="18" r="10" fill="hsl(var(--card))" />
                      <text x="18" y="19" text-anchor="middle" class="fill-current text-foreground" font-size="7" font-weight="700">
                        {{ Math.round(expenseUsage) }}%
                      </text>
                    </svg>
                  </div>
                  <div class="space-y-1 text-sm">
                    <p class="font-semibold text-foreground">이번 달 소비 금액</p>
                    <p class="text-muted-foreground">
                      {{ formatCurrency(monthlyExpenseAmount) }}원 / {{ formatCurrency(monthlyBudget || 0) }}원
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="p-4 text-sm text-muted-foreground text-center">
              데이터를 불러오는 중입니다.
            </div>
          </UiCard>
        </div>

        <!-- =======================
             Security (Password)
        ======================== -->
        <div v-if="tab === 'security'" class="space-y-4">
          <div class="border border-border rounded-md bg-card p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-foreground">비밀번호 변경</h2>

            <form class="space-y-4 mt-4" @submit.prevent="savePassword">
              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">현재 비밀번호</label>
                <UiInput
                  v-model="pw.currentPassword"
                  type="password"
                  autocomplete="current-password"
                />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">새 비밀번호</label>
                <UiInput v-model="pw.newPassword" type="password" autocomplete="new-password" />
              </div>

              <div class="grid gap-2">
                <label class="text-sm text-muted-foreground">새 비밀번호 확인</label>
                <UiInput
                  v-model="pw.newPasswordConfirm"
                  type="password"
                  autocomplete="new-password"
                />
                <p
                  v-if="passwordsMatch !== null"
                  class="text-xs mt-1"
                  :class="passwordsMatch ? 'text-green-600' : 'text-red-500'"
                >
                  {{ passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
                </p>
              </div>

              <p v-if="pwError" class="text-sm text-red-500">{{ pwError }}</p>

              <div class="text-right">
                <button
                  type="submit"
                  class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                  :disabled="pwSaving"
                >
                  {{ pwSaving ? '저장 중...' : '저장하기' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Notifications / Privacy (기존 유지) -->
        <div v-if="tab === 'notifications'">
          <div class="border border-border rounded-md bg-card p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-foreground">Notification Settings</h2>
            <div class="space-y-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <div class="flex items-center space-x-2">
                    <UiCheckbox v-model="notif.email" />
                    <label class="text-sm">Email Notifications</label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <UiCheckbox v-model="notif.push" />
                    <label class="text-sm">Push Notifications</label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <UiCheckbox v-model="notif.sms" />
                    <label class="text-sm">SMS Notifications</label>
                  </div>
                </div>
                <div>
                  <label class="text-sm text-muted-foreground">Notification Frequency</label>
                  <UiSelect v-model="notif.frequency">
                    <option value="real-time">Real-time</option>
                    <option value="daily">Daily</option>
                  </UiSelect>
                </div>
              </div>
              <div class="text-right">
                <button
                  @click="saveNotifications"
                  class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tab === 'privacy'">
          <div class="border border-border rounded-md bg-card p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-foreground">Privacy Settings</h2>
            <div class="space-y-4 mt-4">
              <div class="flex items-center justify-between">
                <label class="text-sm text-muted-foreground">Share analytics data</label>
                <UiSwitch v-model:modelValue="priv.analyticsSharing" />
              </div>
              <div class="flex items-center justify-between">
                <label class="text-sm text-muted-foreground">Allow personalized ads</label>
                <UiSwitch v-model:modelValue="priv.personalizedAds" />
              </div>
              <div class="text-right">
                <button @click="savePrivacy" class="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                  Save Privacy Settings
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Layout>
</template>

<script>
import { defineComponent, reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import UiSwitch from '@/components/ui/Switch.vue'
import UiCheckbox from '@/components/ui/Checkbox.vue'
import UiCard from '@/components/ui/Card.vue'
import UiSpinner from '@/components/ui/Spinner.vue'
import { fetchTransactionDailySummary } from '@/services/transaction.service'
import { fetchTransactionSummary } from '@/services/transaction.service'
import {
  fetchMe,
  updateUser,
  checkNickname,
  updatePassword,
  deleteUser,
} from '@/services/user.service'

const CATEGORY_LABELS = {
  1: '식사',
  2: '카페·간식',
  3: '쇼핑',
  4: '이동·차량',
  5: '주거·생활요금',
  6: '건강·의료',
  7: '교육',
  8: '여가·취미',
  9: '금융',
  10: '기타',
}

const PRIMARY_PIE_COLOR = '#fed253'
const NEUTRAL_PIE_COLORS = [
  'rgba(0,0,0,0.8)',
  'rgba(0,0,0,0.65)',
  'rgba(0,0,0,0.5)',
  'rgba(0,0,0,0.35)',
  'rgba(0,0,0,0.25)',
]

export default defineComponent({
  name: 'MypageView',
  components: { Layout, PageHeader, UiInput, UiSelect, UiSwitch, UiCheckbox, UiCard, UiSpinner },
  setup() {
    const router = useRouter()
    const auth = useAuthStore()

    const loading = ref(false)
    const saving = ref(false)
    const deleting = ref(false)

    const tabs = [
      { value: 'account', label: '계정 정보' },
      { value: 'security', label: '비밀번호' },
      { value: 'notifications', label: '알림' },
      { value: 'privacy', label: 'Privacy' },
    ]
    const tab = ref('account')

    const local = reactive({
      userId: null,
      loginId: '',
      nickname: '',
      name: '',
      phoneNumber: '',
      email: '',
      monthlyBudget: null,
      triggerBudget: null,
      createdAt: null,
      upDatedAt: null,
      profileVisibility: 'PUBLIC',
      shareLevel: null,
      role: null,
    })

    // 알림/프라이버시 (임시)
    const notif = reactive({ email: false, push: false, sms: false, frequency: 'real-time' })
    const priv = reactive({ analyticsSharing: false, personalizedAds: false })

    const summaryLoading = ref(false)
    const monthlyExpenseAmount = ref(0)
    const monthlyImpulseAmount = ref(0)

    // -------------------------
    // 유틸
    // -------------------------
    const toNumberOrNull = (v) => {
      if (v === '' || v === null || v === undefined) return null
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    }

    // 숫자만
    const normalizePhone = (raw) => String(raw ?? '').replace(/\D/g, '')

    // 한국 휴대폰: 01 + (8~9자리) => 총 10~11자리
    const isValidKoreanMobile = (digits) => /^01\d{8,9}$/.test(digits)

    // 화면 입력은 하이픈 허용, 저장은 숫자만
    const phoneError = ref('')
    watch(
      () => local.phoneNumber,
      (v) => {
        const digits = normalizePhone(v)
        if (!digits) {
          phoneError.value = ''
          return
        }
        phoneError.value = isValidKoreanMobile(digits)
          ? ''
          : '휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678'
      }
    )

    function debounce(fn, delay) {
      let timer = null
      return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
      }
    }

    const formatCurrency = (value) => {
      return (value ?? 0).toLocaleString('ko-KR')
    }

    const formatLocalDateTime = (date) => {
      const pad = (n) => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours(),
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    const startOfMonth = () => {
      const d = new Date()
      d.setDate(1)
      d.setHours(0, 0, 0, 0)
      return d
    }

    const loadBudgetSummary = async () => {
      summaryLoading.value = true
      try {
        const now = new Date()
        const res = await fetchTransactionSummary({
          from: formatLocalDateTime(startOfMonth()),
          to: formatLocalDateTime(now),
        })
        monthlyExpenseAmount.value = res?.data?.totalExpense ?? 0
        monthlyImpulseAmount.value = res?.data?.totalImpulseExpense ?? 0
      } catch (e) {
        console.error(e)
      } finally {
        summaryLoading.value = false
      }
    }

    // -------------------------
    // 닉네임 중복 체크
    // -------------------------
    const originalNickname = ref('')

    const nicknameCheckState = reactive({
      loading: false,
      available: null, // true | false | null
      message: '',
    })

    const checkNicknameDup = async () => {
      const value = (local.nickname || '').trim()

      if (!value) {
        nicknameCheckState.loading = false
        nicknameCheckState.available = null
        nicknameCheckState.message = ''
        return
      }

      // 원래 닉네임이면 OK 처리
      if (value === originalNickname.value) {
        nicknameCheckState.loading = false
        nicknameCheckState.available = true
        nicknameCheckState.message = '현재 사용 중인 닉네임입니다.'
        return
      }

      try {
        const { data } = await checkNickname(value)
        nicknameCheckState.available = data.available
        nicknameCheckState.message = data.available
          ? '사용 가능한 닉네임입니다.'
          : '이미 존재하는 닉네임입니다.'
      } catch (e) {
        nicknameCheckState.available = null
        nicknameCheckState.message = '닉네임 확인 중 오류가 발생했습니다.'
      } finally {
        nicknameCheckState.loading = false
      }
    }

    const debouncedCheckNickname = debounce(checkNicknameDup, 400)

    const onNicknameInput = () => {
      nicknameCheckState.loading = true
      nicknameCheckState.available = null
      nicknameCheckState.message = ''
      debouncedCheckNickname()
    }

    // template에서 쓰기 쉽게 별칭
    const nicknameCheck = nicknameCheckState

    // -------------------------
    // 내 정보 로드
    // -------------------------
    const loadMe = async () => {
      loading.value = true
      try {
        const { data } = await fetchMe()
        Object.assign(local, data)
        originalNickname.value = data.nickname || ''
        // 초기 상태는 “검증 완료”로 간주
        nicknameCheckState.available = true
        nicknameCheckState.message = ''
      } catch (err) {
        console.log('status', err?.response?.status)
        console.log('body', err?.response?.data)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadMe()
      loadBudgetSummary()
    })

    // -------------------------
    // 저장(PATCH /api/v1/users/{userId})
    // -------------------------
    const saveAccount = async () => {
      if (!local.userId) {
        alert('userId가 없습니다. /me 응답을 확인해주세요.')
        return
      }

      const nextNickname = (local.nickname || '').trim()

      // 닉네임 변경 시 중복확인 강제
      if (nextNickname !== originalNickname.value) {
        if (nicknameCheckState.available !== true) {
          alert('닉네임 중복 확인을 완료해주세요.')
          return
        }
      }

      // 휴대폰 정규화 + 검증
      const normalizedPhone = normalizePhone(local.phoneNumber)
      if (!isValidKoreanMobile(normalizedPhone)) {
        alert('휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678')
        return
      }

      saving.value = true
      try {
        const body = {
          nickname: nextNickname,
          email: (local.email || '').trim(),
          monthlyBudget: toNumberOrNull(local.monthlyBudget),
          triggerBudget: toNumberOrNull(local.triggerBudget),
          profileVisibility: local.profileVisibility,
          name: (local.name || '').trim(),
          phoneNumber: normalizedPhone, // 숫자만 전달
          // shareLevel / role 등은 “수정받지 않아도 됨”이면 보내지 않는 게 안전
        }

        await updateUser(local.userId, body)
        alert('수정이 완료되었습니다.')
        await loadMe()
      } catch (err) {
        console.log('status', err?.response?.status)
        console.log('body', err?.response?.data)
        alert(err?.response?.data?.message || '수정에 실패했습니다.')
      } finally {
        saving.value = false
      }
    }

    // -------------------------
    // 비밀번호 변경(PATCH /api/v1/users/{userId}/password)
    // -------------------------
    const pw = reactive({
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    })

    const passwordsMatch = computed(() => {
      if (!pw.newPassword || !pw.newPasswordConfirm) return null
      return pw.newPassword === pw.newPasswordConfirm
    })

    const pwSaving = ref(false)
    const pwError = ref('')

    const validatePassword = () => {
      pwError.value = ''

      if (!pw.currentPassword || !pw.newPassword || !pw.newPasswordConfirm) {
        pwError.value = '모든 항목을 입력해주세요.'
        return false
      }

      if (passwordsMatch.value === false) {
        pwError.value = '새 비밀번호와 확인 값이 일치하지 않습니다.'
        return false
      }

      if (pw.currentPassword === pw.newPassword) {
        pwError.value = '현재 비밀번호와 새 비밀번호가 같습니다.'
        return false
      }

      return true
    }

    const resetPwForm = () => {
      pw.currentPassword = ''
      pw.newPassword = ''
      pw.newPasswordConfirm = ''
      pwError.value = ''
    }

    const savePassword = async () => {
      if (!local.userId) {
        alert('userId가 없습니다. /me 응답을 확인해주세요.')
        return
      }
      if (!validatePassword()) return

      pwSaving.value = true
      try {
        const body = {
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
          newPasswordConfirm: pw.newPasswordConfirm,
        }

        await updatePassword(local.userId, body)

        alert('비밀번호가 변경되었습니다.')
        resetPwForm()
      } catch (err) {
        console.log('status', err?.response?.status)
        console.log('body', err?.response?.data)
        pwError.value = err?.response?.data?.message || '비밀번호 변경에 실패했습니다.'
      } finally {
        pwSaving.value = false
      }
    }

    // -------------------------
    // 탈퇴(DELETE /api/v1/users/{userId}) 후 로그아웃 + /
    // -------------------------
    const handleDeleteAccount = async () => {
      const ok = window.confirm('정말 탈퇴하시겠습니까? 탈퇴하면 복구할 수 없습니다.')
      if (!ok) return

      if (!local.userId) {
        alert('userId가 없습니다. /me 응답을 확인해주세요.')
        return
      }

      deleting.value = true
      try {
        await deleteUser(local.userId)
        await auth.logout()
        router.push('/')
      } catch (err) {
        console.log('status', err?.response?.status)
        console.log('body', err?.response?.data)
        alert(err?.response?.data?.message || '탈퇴에 실패했습니다.')
      } finally {
        deleting.value = false
      }
    }

    // -------------------------
    // 기타
    // -------------------------
    function saveNotifications() {
      alert('Notification settings saved')
    }
    function savePrivacy() {
      alert('Privacy settings saved')
    }

    const impulseUsage = computed(() => {
      const budget = toNumberOrNull(local.triggerBudget) || 0
      if (!budget) return 0
      return Math.max(0, Math.min((monthlyImpulseAmount.value / budget) * 100, 100))
    })

    const expenseUsage = computed(() => {
      const budget = toNumberOrNull(local.monthlyBudget) || 0
      if (!budget) return 0
      return Math.max(0, Math.min((monthlyExpenseAmount.value / budget) * 100, 100))
    })

    const impulseUsageCap = computed(() => Math.min(Math.round(impulseUsage.value), 100))
    const expenseUsageCap = computed(() => Math.min(Math.round(expenseUsage.value), 100))

    return {
      loading,
      saving,
      deleting,
      tabs,
      tab,
      local,
      notif,
      priv,

      nicknameCheck,
      onNicknameInput,

      phoneError,
      saveAccount,

      pw,
      pwSaving,
      pwError,
      passwordsMatch,
      savePassword,

      handleDeleteAccount,

      saveNotifications,
      savePrivacy,

      summaryLoading,
      monthlyExpenseAmount,
      monthlyImpulseAmount,
      monthlyBudget: local.monthlyBudget,
      triggerBudget: local.triggerBudget,
      expenseUsage,
      impulseUsage,
      expenseUsageCap,
      impulseUsageCap,
      formatCurrency,
    }
  },
})
</script>

<style scoped></style>
