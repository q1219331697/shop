<template>
  <!-- :methods 覆盖内置 CRUD 行为：新增/详情跳转独立页面（弹窗改页面） -->
  <CrudTable ref="crudTableRef" :schema="roleSchema" :api="api.role" :methods="crudMethods">
    <!-- 行内操作：编辑/禁用/启用/分配权限 -->
    <template #row-actions-extra="{ row }">
      <el-button v-if="!row.deleted" link class="action-link" @click="goEdit(row)">
        <el-icon><Edit /></el-icon>编辑
      </el-button>
      <el-button
        v-if="!row.deleted && row.status === 1"
        link
        class="action-link"
        @click="handleDisable(row)"
      >
        <el-icon><Lock /></el-icon>禁用
      </el-button>
      <el-button
        v-if="!row.deleted && row.status === 0"
        link
        class="action-link"
        @click="handleEnable(row)"
      >
        <el-icon><Unlock /></el-icon>启用
      </el-button>
      <el-button v-if="!row.deleted" link class="action-link" @click="goAssignPermission(row)">
        <el-icon><Key /></el-icon>分配权限
      </el-button>
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
/**
 * 角色管理 - 基于 CrudTable 的 CRUD 页面
 * <p>交互形态（弹窗改页面）：新增/编辑/详情/分配权限跳转独立页面；禁用/启用保持原位。</p>
 */
import { Edit, Lock, Unlock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api'
import type { RoleItem } from '@/api'
import { CrudTable } from '@/components/CrudTable'

import { roleSchema } from './schema'

const router = useRouter()
const crudTableRef = ref<InstanceType<typeof CrudTable>>()

/** 刷新列表 */
function refreshList() {
  crudTableRef.value?.crud.fetchData()
}

// 表单类动作改路由跳转（弹窗 -> 页面）
const crudMethods = {
  onCreate: () => router.push('/system/role/create'),
  onDetail: (row: RoleItem) => router.push(`/system/role/detail/${row.id}`),
}

// 行内编辑/分配权限跳转
function goEdit(row: RoleItem) {
  router.push(`/system/role/edit/${row.id}`)
}
function goAssignPermission(row: RoleItem) {
  router.push(`/system/role/assign-permission/${row.id}`)
}

// 禁用/启用（确认类，保持原逻辑）
async function handleDisable(row: RoleItem) {
  await api.role.disable(row.id)
  ElMessage.success('禁用成功')
  refreshList()
}
async function handleEnable(row: RoleItem) {
  await api.role.enable(row.id)
  ElMessage.success('启用成功')
  refreshList()
}
</script>

<style lang="scss" scoped>
.action-link {
  font-size: 14px;
  color: #5a9cf8;
  white-space: nowrap;

  &:hover {
    color: #2d7de6;
  }
}
</style>
