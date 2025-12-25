<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-background to-muted p-4">
    <div class="w-full max-w-2xl border border-border bg-white rounded-lg">
      <div class="text-center space-y-3 py-6">
        <div class="flex justify-center">
          <div class="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <span class="text-3xl">🔑</span>
          </div>
        </div>
        <div class="text-3xl font-bold text-foreground">비밀번호 찾기</div>
        <div class="text-base text-muted-foreground">계정 정보를 인증하고 새 비밀번호를 설정하세요.</div>
      </div>

      <div class="px-8 pb-8 space-y-8">
        <div class="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-foreground">1. 본인 확인</p>
              <p class="text-xs text-muted-foreground">가입 시 사용한 정보로 인증번호를 받아주세요.</p>
            </div>
            <UiButton
              type="button"
              class="h-10"
              :disabled="sendLoading"
              @click="sendCode"
            >
              {{ sendLoading ? '전송 중...' : '인증번호 전송' }}
            </UiButton>
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium" for="loginId">아이디</label>
              <input
                id="loginId"
                v-model="form.loginId"
                type="text"
                class="h-10 w-full border border-border rounded px-2"
                placeholder="로그인 ID"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium" for="email">이메일</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="h-10 w-full border border-border rounded px-2"
                placeholder="가입 이메일"
              />
            </div>
          </div>
          <p v-if="resendAvailableAt" class="text-xs text-muted-foreground">
            다음 전송 가능 시간: {{ formatTime(resendAvailableAt) }} (유효기간 {{ expiresInSeconds }}초)
          </p>
        </div>

        <div
          v-if="currentStep >= 2"
          class="bg-muted/50 border border-border rounded-lg p-4 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-foreground">2. 인증번호 확인</p>
              <p class="text-xs text-muted-foreground">이메일로 받은 6자리 코드를 입력하세요.</p>
            </div>
            <UiButton
              type="button"
              variant="secondary"
              class="h-10"
              :disabled="verifyLoading"
              @click="verifyCode"
            >
              {{ verifyLoading ? '확인 중...' : '인증 확인' }}
            </UiButton>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium" for="verificationCode">인증번호</label>
            <input
              id="verificationCode"
              v-model="form.verificationCode"
              type="text"
              class="h-11 w-full border border-border rounded px-2"
              placeholder="123456"
              :disabled="verified"
            />
          </div>
          <p v-if="verified" class="text-xs text-green-600">인증이 완료되었습니다.</p>
        </div>

        <div
          v-if="currentStep >= 3"
          class="bg-muted/50 border border-border rounded-lg p-4 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-foreground">3. 새 비밀번호 설정</p>
              <p class="text-xs text-muted-foreground">인증 후 새로운 비밀번호를 입력하세요.</p>
            </div>
            <UiButton
              type="button"
              class="h-10"
              :disabled="resetLoading"
              @click="resetPassword"
            >
              {{ resetLoading ? '변경 중...' : '비밀번호 변경' }}
            </UiButton>
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium" for="newPassword">새 비밀번호</label>
              <input
                id="newPassword"
                v-model="form.newPassword"
                type="password"
                class="h-11 w-full border border-border rounded px-2"
                placeholder="새 비밀번호"
                :disabled="!verified"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium" for="newPasswordConfirm">새 비밀번호 확인</label>
              <input
                id="newPasswordConfirm"
                v-model="form.newPasswordConfirm"
                type="password"
                class="h-11 w-full border border-border rounded px-2"
                placeholder="한 번 더 입력"
                :disabled="!verified"
              />
              <p
                v-if="passwordsMatch !== null"
                class="text-xs mt-1"
                :class="passwordsMatch ? 'text-green-600' : 'text-red-500'"
              >
                {{ passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-1">
          <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>
          <p v-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>
        </div>

        <div class="text-center text-sm text-muted-foreground">
          기억이 나셨나요?
          <router-link to="/login" class="text-primary hover:text-primary/80 font-semibold">로그인으로 돌아가기</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/Button.vue'
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from '@/services/auth.service'

export default {
  name: 'PasswordResetView',
  components: { UiButton },
  setup() {
    const router = useRouter()
    const form = reactive({
      loginId: '',
      email: '',
      verificationCode: '',
      newPassword: '',
      newPasswordConfirm: '',
    })

    const currentStep = ref(1)
    const sendLoading = ref(false)
    const verifyLoading = ref(false)
    const resetLoading = ref(false)
    const verified = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')
    const resendAvailableAt = ref(null)
    const expiresInSeconds = ref(null)

    const passwordsMatch = computed(() => {
      if (!form.newPassword || !form.newPasswordConfirm) return null
      return form.newPassword === form.newPasswordConfirm
    })

    const clearMessages = () => {
      errorMessage.value = ''
      successMessage.value = ''
    }

    const requiredUserFields = () => {
      if (!form.loginId || !form.email) {
        errorMessage.value = '아이디와 이메일을 모두 입력해주세요.'
        return false
      }
      return true
    }

    const sendCode = async () => {
      clearMessages()
      if (!requiredUserFields()) return

      sendLoading.value = true
      try {
        const { data } = await sendPasswordResetCode({
          loginId: form.loginId,
          email: form.email,
        })
        currentStep.value = 2
        verified.value = false
        form.verificationCode = ''
        resendAvailableAt.value = data?.resendAvailableAt ?? null
        expiresInSeconds.value = data?.expiresInSeconds ?? null
        successMessage.value = '인증번호를 전송했습니다. 이메일을 확인하세요.'
      } catch (err) {
        errorMessage.value = err?.response?.data?.message || '인증번호 전송에 실패했습니다.'
      } finally {
        sendLoading.value = false
      }
    }

    const verifyCode = async () => {
      clearMessages()
      if (currentStep.value < 2) {
        errorMessage.value = '먼저 인증번호를 요청해주세요.'
        return
      }
      if (!requiredUserFields()) return
      if (!form.verificationCode) {
        errorMessage.value = '인증번호를 입력해주세요.'
        return
      }

      verifyLoading.value = true
      try {
        await verifyPasswordResetCode({
          loginId: form.loginId,
          verificationCode: form.verificationCode,
        })
        verified.value = true
        currentStep.value = 3
        successMessage.value = '인증이 완료되었습니다. 새 비밀번호를 입력하세요.'
      } catch (err) {
        errorMessage.value = err?.response?.data?.message || '인증번호 확인에 실패했습니다.'
      } finally {
        verifyLoading.value = false
      }
    }

    const resetPassword = async () => {
      clearMessages()
      if (!verified.value) {
        errorMessage.value = '인증을 완료한 뒤 비밀번호를 변경할 수 있습니다.'
        return
      }
      if (!requiredUserFields()) return
      if (passwordsMatch.value === false) {
        errorMessage.value = '새 비밀번호가 일치하지 않습니다.'
        return
      }

      resetLoading.value = true
      try {
        await confirmPasswordReset({
          loginId: form.loginId,
          newPassword: form.newPassword,
          newPasswordConfirm: form.newPasswordConfirm,
        })
        successMessage.value = '비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.'
        setTimeout(() => router.push('/login'), 800)
      } catch (err) {
        errorMessage.value = err?.response?.data?.message || '비밀번호 변경에 실패했습니다.'
      } finally {
        resetLoading.value = false
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    }

    return {
      form,
      currentStep,
      sendLoading,
      verifyLoading,
      resetLoading,
      verified,
      errorMessage,
      successMessage,
      resendAvailableAt,
      expiresInSeconds,
      passwordsMatch,
      sendCode,
      verifyCode,
      resetPassword,
      formatTime,
    }
  },
}
</script>

<style scoped></style>
