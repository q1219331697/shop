<template>
  <PageContainer>
    <div v-loading="loading" class="detail-page">
      <CrudDetailContent :fields="permissionDetailFields" :data="detail" :loading="loading">
        <template #detail-parentId="{ value }">
          {{ permissionNameMap.get(Number(value)) ?? '-' }}
        </template>
      </CrudDetailContent>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * 权限 - 详情页（弹窗改页面）
 * <p>复用 permissionDetailFields，上级权限名称通过插槽回显。</p>
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type PermissionItem } from '@/api'
import CrudDetailContent from '@/components/CrudDetailContent.vue'
import { flattenPermissionTree } from '@/utils/permissionTree'

import { permissionDetailFields } from './schema'

const route = useRoute()

const detail = ref<Record<string, unknown>>({})
const loading = ref(false)

const permissionTree = ref<PermissionItem[]>([])
const permissionNameMap = computed(() => {
  const map = new Map<number, string>()
  flattenPermissionTree(permissionTree.value).forEach((node) => {
    map.set(node.id, node.permissionName)
  })
  map.set(0, '顶级权限')
  return map
})

onMounted(async () => {
  const raw = route.params.id
  if (!raw) return
  const uid = Number(raw)
  loading.value = true
  try {
    const [data, tree] = await Promise.all([api.permission.detail(uid), api.permission.tree()])
    detail.value = data
    permissionTree.value = tree
  } catch {
    detail.value = {}
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  padding: 16px;
  max-width: 580px;
}
</style>
