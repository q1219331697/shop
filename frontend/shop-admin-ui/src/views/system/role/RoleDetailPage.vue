<template>
  <SubPage body-class="detail-page" footer-class="detail-footer">
    <CrudDetailContent :fields="roleSchema.detailFields ?? []" :data="detail" :loading="loading" />
    <template #footer>
      <el-button @click="goBackToList">返 回</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 角色 - 详情页（弹窗改页面）
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type RoleItem } from '@/api'
import CrudDetailContent from '@/components/CrudDetailContent.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

import { roleSchema } from './schema'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/role） */
const { goBackToList } = usePageNav()

const detail = ref<RoleItem | null>(null)
const loading = ref(false)

onMounted(async () => {
  const raw = route.params.id
  if (!raw) return
  loading.value = true
  try {
    detail.value = await api.role.detail(Number(raw))
  } catch {
    /* 请求工具已处理 */
  } finally {
    loading.value = false
  }
})
</script>
