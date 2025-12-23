<template>
  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
    <div>
      <h1 class="text-3xl font-bold text-foreground">{{ title }}</h1>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="$slots.right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>
