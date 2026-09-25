<template>
  <SubPage body-class="detail-page" footer-class="detail-footer">
    <CrudDetailContent
      :fields="adminUserSchema.detailFields ?? []"
      :data="detail"
      :loading="loading"
    />
    <template #footer>
      <el-button @click="goBackToList">返 回</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 管理员 - 详情页（弹窗改页面）
 * <p>复用 adminUserSchema 的 detailFields，与弹窗共享同一套详情渲染。</p>
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type AdminUserItem } from '@/api'
import CrudDetailContent from '@/components/CrudDetailContent.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

import { adminUserSchema } from './schema'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/admin） */
const { goBackToList } = usePageNav()

const detail = ref<AdminUserItem | null>(null)
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
</script>
