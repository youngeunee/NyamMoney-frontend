<template>
  <Layout>
    <div class="p-6 space-y-6">
      <PageHeader title="게시판" description="원하는 게시판을 선택하고 글을 확인하세요." />
      <router-view />
    </div>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  components: { Layout, PageHeader },
}
</script>
