<template>
  <PageContainer>
    <template #actions>
      <el-button @click="goBack">返回</el-button>
    </template>
    <div class="detail-page">
      <CrudDetailContent
        :fields="adminUserSchema.detailFields ?? []"
        :data="detail"
        :loading="loading"
      />
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * 管理员 - 详情页（弹窗改页面）
 * <p>复用 adminUserSchema 的 detailFields，与弹窗共享同一套详情渲染。</p>
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api'
import CrudDetailContent from '@/components/CrudDetailContent.vue'

import { adminUserSchema } from './schema'

const route = useRoute()
const router = useRouter()

const detail = ref<Record<string, unknown>>({})
const loading = ref(false)

onMounted(async () => {
  const raw = route.params.id
  if (!raw) return
  loading.value = true
  try {
    detail.value = await api.adminUser.detail(Number(raw))
  } catch {
    /* 请求工具已处理 */
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.detail-page {
  padding: 16px;
  max-width: 560px;
}
</style>
