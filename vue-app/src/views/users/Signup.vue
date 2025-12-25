<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-background to-muted p-4 py-8">
    <div class="w-full max-w-2xl border border-border bg-white rounded-lg">
      <div class="text-center space-y-4 py-6">
        <div class="flex justify-center">
          <div class="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <span class="text-3xl">🐱</span>
          </div>
        </div>
        <div class="text-3xl font-bold text-foreground">회원가입</div>
        <div class="text-base text-muted-foreground">냠 머니에 가입해 소비 습관을 확인해보세요!</div>
      </div>

      <form @submit.prevent="submit" class="space-y-5 px-8 pb-8">
        <!-- loginId / nickname -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="loginId">아이디 *</label>
            <input id="loginId" v-model="form.loginId" @input="onLoginIdInput" type="text" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="아이디를 입력하세요." />
            <p
              v-if="loginIdCheck.message || loginIdCheck.loading"
              class="text-xs mt-1"
              :class="loginIdCheck.available ? 'text-green-600' : 'text-red-500'"
            >
              {{ loginIdCheck.loading ? 'ID 확인 중...' : loginIdCheck.message }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="nickname">닉네임 *</label>
            <input id="nickname" v-model="form.nickname" @input="onNicknameInput" type="text" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="닉네임을 입력하세요." />
            <p
              v-if="nicknameCheck.message || nicknameCheck.loading"
              class="text-xs mt-1"
              :class="nicknameCheck.available ? 'text-green-600' : 'text-red-500'"
            >
              {{ nicknameCheck.loading ? '닉네임 확인 중...' : nicknameCheck.message }}
            </p>
          </div>
        </div>

        <!-- ✅ 추가: name / phoneNumber -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="name">이름 *</label>
            <input id="name" v-model="form.name" type="text" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="이름을 입력하세요." />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="phoneNumber">핸드폰 번호 *</label>
            <input id="phoneNumber" v-model="form.phoneNumber" type="tel" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="01012345678" />
          </div>
        </div>

        <!-- email -->
        <div class="space-y-2">
          <label class="text-sm font-medium" for="email">이메일 *</label>
          <div class="flex gap-2">
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="h-11 w-full border border-border rounded px-2 py-1"
              placeholder="your@email.com"
              :disabled="emailVerified"
            />
            <UiButton
              type="button"
              variant="outline"
              class="h-11 whitespace-nowrap"
              :disabled="emailSending || !form.email"
              @click="sendCode"
            >
              {{ emailVerified ? '인증완료' : emailSending ? '전송 중...' : '인증요청' }}
            </UiButton>
          </div>
          <div class="flex gap-2 items-center">
            <input
              v-model="emailCode"
              type="text"
              class="h-11 flex-1 border border-border rounded px-2 py-1"
              placeholder="인증번호 6자리"
              :disabled="emailVerified"
            />
            <UiButton
              type="button"
              variant="secondary"
              class="h-11 whitespace-nowrap"
              :disabled="emailVerified || emailVerifying || !emailCode"
              @click="verifyCode"
            >
              {{ emailVerified ? '완료' : emailVerifying ? '확인 중...' : '인증확인' }}
            </UiButton>
          </div>
          <p v-if="emailMessage" :class="['text-xs', emailVerified ? 'text-green-600' : 'text-red-500']">
            {{ emailMessage }}
          </p>
        </div>

        <!-- password / confirm -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="password">비밀번호 *</label>
            <input id="password" v-model="form.password" type="password" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="비밀번호를 입력하세요." />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="passwordConfirm">비밀번호 확인 *</label>
            <input id="passwordConfirm" v-model="form.passwordConfirm" type="password" required
              class="h-11 w-full border border-border rounded px-2 py-1" placeholder="비밀번호를 한 번 더 입력하세요." />
            <p
              v-if="passwordsMatch !== null"
              class="text-xs mt-1"
              :class="passwordsMatch ? 'text-green-600' : 'text-red-500'"
            >
              {{ passwordsMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.' }}
            </p>
          </div>
        </div>

        <!-- profileVisibility -->
        <div class="space-y-3 pt-2">
          <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
            계정 공개 범위 *
          </h3>
          <div class="flex gap-4">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="PUBLIC" v-model="form.profileVisibility"
                class="w-4 h-4 text-primary focus:ring-primary" />
              <span class="text-sm font-medium">Public</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="PROTECTED" v-model="form.profileVisibility"
                class="w-4 h-4 text-primary focus:ring-primary" />
              <span class="text-sm font-medium">Protected</span>
            </label>
          </div>
          <p class="text-xs text-muted-foreground">
            Public 계정은 모두에게 보여집니다.
          </p>
        </div>

        <!-- budget -->
        <div class="pt-2 pb-1">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            예산 설정
          </h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium" for="monthlyBudget">이번 달 예산 *</label>
              <input id="monthlyBudget" v-model="form.monthlyBudget" type="number" required
                class="h-11 w-full border border-border rounded px-2 py-1" placeholder="500000" />
              <p class="text-xs text-muted-foreground">이번 달 목표 지출 비용을 입력해주세요.</p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium" for="triggerBudget">냠 비용 예산 *</label>
              <input id="triggerBudget" v-model="form.triggerBudget" type="number" required
                class="h-11 w-full border border-border rounded px-2 py-1" placeholder="100000" />
              <p class="text-xs text-muted-foreground">냠 비용 목표를 입력해주세요.</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col space-y-4 pt-4">
          <UiButton
            type="submit"
            class="w-full h-11 text-base font-semibold"
            :disabled="loading"
          >
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </UiButton>
          <div class="text-center text-sm text-muted-foreground">
            이미 계정을 가지고 있나요?
            <router-link to="/login" class="text-primary hover:text-primary/80 font-semibold">로그인</router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import UiButton from '@/components/ui/Button.vue'
import {
  signup as signupApi,
  checkLoginId as checkLoginIdApi,
  checkNickname as checkNicknameApi,
} from '@/services/user.service'
import { sendSignupCode, verifySignupCode } from '@/services/auth.service'

export default {
  name: 'SignupView',
  components: { UiButton },
  setup() {
    const router = useRouter()

    const loading = ref(false)
    const errorMessage = ref('')
    const emailSending = ref(false)
    const emailVerifying = ref(false)
    const emailVerified = ref(false)
    const emailMessage = ref('')
    const emailCode = ref('')

    function debounce(fn, delay) {
      let timer = null
      return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
      }
    }

    function normalizePhoneNumber(value) {
      return value.replace(/[^0-9]/g, '')
    }

    function isValidKoreanMobile(phoneDigits) {
      return /^010\d{8}$/.test(phoneDigits)
    }

    const loginIdCheck = reactive({ loading: false, available: null, message: '' })
    const nicknameCheck = reactive({ loading: false, available: null, message: '' })

    // ✅ UserSignupRequest에 맞춘 폼
    const form = reactive({
      loginId: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      email: '',
      name: '',
      phoneNumber: '',
      profileVisibility: 'PUBLIC',
      monthlyBudget: '',
      triggerBudget: '',
    })

    const passwordsMatch = computed(() => {
      if (!form.password || !form.passwordConfirm) return null
      return form.password === form.passwordConfirm
    })

    const checkLoginId = async () => {
      const value = form.loginId.trim()
      if (!value) {
        loginIdCheck.loading = false
        loginIdCheck.available = null
        loginIdCheck.message = ''
        return
      }

      try {
        const { data } = await checkLoginIdApi(value)
        loginIdCheck.available = data.available
        loginIdCheck.message = data.available ? '사용 가능한 ID입니다.' : '이미 존재하는 ID입니다.'
      } catch (e) {
        loginIdCheck.available = null
        loginIdCheck.message = 'ID 확인 중 오류가 발생했습니다.'
      } finally {
        loginIdCheck.loading = false
      }
    }

    const debouncedCheckLoginId = debounce(checkLoginId, 300)

    const onLoginIdInput = () => {
      loginIdCheck.loading = true
      loginIdCheck.available = null
      loginIdCheck.message = ''
      debouncedCheckLoginId()
    }

    const checkNickname = async () => {
      const value = form.nickname.trim()
      if (!value) {
        nicknameCheck.loading = false
        nicknameCheck.available = null
        nicknameCheck.message = ''
        return
      }

      try {
        const { data } = await checkNicknameApi(value)
        nicknameCheck.available = data.available
        nicknameCheck.message = data.available ? '사용 가능한 닉네임입니다.' : '이미 존재하는 닉네임입니다.'
      } catch (e) {
        nicknameCheck.available = null
        nicknameCheck.message = '닉네임 확인 중 오류가 발생했습니다.'
      } finally {
        nicknameCheck.loading = false
      }
    }

    const debouncedCheckNickname = debounce(checkNickname, 400)

    const onNicknameInput = () => {
      nicknameCheck.loading = true
      nicknameCheck.available = null
      nicknameCheck.message = ''
      debouncedCheckNickname()
    }

    const submit = async () => {
      errorMessage.value = ''
      const phoneDigits = normalizePhoneNumber(form.phoneNumber)

      if (!emailVerified.value) {
        alert('이메일 인증을 완료해주세요.')
        return
      }
      if (!isValidKoreanMobile(phoneDigits)) {
        alert('전화번호 형식이 올바르지 않습니다. 예) 010-1234-1234')
        return
      }
      if (passwordsMatch.value === false) {
        alert('비밀번호가 일치하지 않습니다.')
        return
      }
      if (loginIdCheck.available === false) {
        alert('이미 사용 중인 로그인 ID입니다.')
        return
      }
      if (nicknameCheck.available === false) {
        alert('이미 사용 중인 닉네임입니다.')
        return
      }

      loading.value = true
      try {
        const body = {
          loginId: form.loginId,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
          nickname: form.nickname,
          email: form.email,
          profileVisibility: form.profileVisibility,
          monthlyBudget: Number(form.monthlyBudget),
          triggerBudget: Number(form.triggerBudget),
          name: form.name,
          phoneNumber: phoneDigits,
        }

        await signupApi(body)

        alert('회원가입이 완료되었습니다!')
        router.push('/login')
      } catch (err) {
        const msg = err?.response?.data?.message || '회원가입 실패. 입력값을 다시 확인해주세요.'
        errorMessage.value = msg
        alert(msg)
      } finally {
        loading.value = false
      }
    }

    const sendCode = async () => {
      if (!form.email) return
      emailMessage.value = ''
      emailSending.value = true
      try {
        await sendSignupCode({ email: form.email })
        emailMessage.value = '인증번호를 전송했습니다. 이메일을 확인해주세요.'
      } catch (e) {
        emailMessage.value = e?.response?.data?.message || '인증번호 전송에 실패했습니다.'
      } finally {
        emailSending.value = false
      }
    }

    const verifyCode = async () => {
      if (!form.email || !emailCode.value) return
      emailMessage.value = ''
      emailVerifying.value = true
      try {
        await verifySignupCode({ email: form.email, verificationCode: emailCode.value })
        emailVerified.value = true
        emailMessage.value = '이메일 인증이 완료되었습니다.'
      } catch (e) {
        emailVerified.value = false
        emailMessage.value = e?.response?.data?.message || '인증번호가 올바르지 않습니다.'
      } finally {
        emailVerifying.value = false
      }
    }

    return {
      form,
      loading,
      errorMessage,
      loginIdCheck,
      nicknameCheck,
      passwordsMatch,
      onLoginIdInput,
      onNicknameInput,
      submit,
      sendCode,
      verifyCode,
      emailSending,
      emailVerifying,
      emailVerified,
      emailMessage,
      emailCode,
    }
  },
}
</script>

<style scoped></style>
