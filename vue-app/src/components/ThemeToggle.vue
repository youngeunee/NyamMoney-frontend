<template>
  <button
    @click="toggleTheme"
    class="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-card text-sm font-medium hover:bg-muted transition"
  >
    {{ currentThemeLabel }}
  </button>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

export default defineComponent({
  name: 'ThemeToggle',
  setup() {
    const store = useSettingsStore()
    const toggleTheme = () => {
      const next = store.settings.theme === 'dark' ? 'light' : 'dark'
      store.updateSettings({ theme: next })
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
    const currentThemeLabel = computed(() => store.settings.theme)
    return { toggleTheme, currentThemeLabel }
  },
})
</script>

<style scoped></style>
