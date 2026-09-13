<template>
  <!-- :methods 覆盖内置 CRUD 行为：新增/详情跳转独立页面（弹窗改页面） -->
  <CrudTable
    ref="crudTableRef"
    :schema="adminUserSchema"
    :api="api.adminUser"
    :methods="crudMethods"
  >
    <!-- 行内操作：编辑/禁用/启用/恢复/分配角色（分配角色改为跳转独立页面） -->
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
      <el-button v-if="row.deleted" link class="action-link" @click="handleRestore(row)">
        <el-icon><RefreshRight /></el-icon>恢复
      </el-button>
      <el-button v-if="!row.deleted" link class="action-link" @click="goAssignRole(row)">
        <el-icon><Key /></el-icon>分配角色
      </el-button>
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
/**
 * 管理员管理 - 基于 CrudTable 的 CRUD 页面
 * <p>
 * 管理后台账号（AdminUserEntity），区别于 C 端会员（UserEntity）。
 * </p>
 * <p>交互形态（弹窗改页面）：新增/编辑/详情/分配角色跳转独立页面；禁用/启用/恢复/删除保持弹窗或原位确认。</p>
 */
import { Edit, Lock, Unlock, RefreshRight, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api'
import type { AdminUserItem } from '@/api'
import { CrudTable } from '@/components/CrudTable'

import { adminUserSchema } from './schema'

const router = useRouter()
const crudTableRef = ref<InstanceType<typeof CrudTable>>()

/** 刷新列表 */
function refreshList() {
  crudTableRef.value?.crud.fetchData()
}

// 表单类动作改路由跳转（弹窗 -> 页面）
const crudMethods = {
  onCreate: () => router.push('/system/admin/create'),
  onDetail: (row: AdminUserItem) => router.push(`/system/admin/detail/${row.id}`),
}

// 行内编辑/分配角色跳转
function goEdit(row: AdminUserItem) {
  router.push(`/system/admin/edit/${row.id}`)
}
function goAssignRole(row: AdminUserItem) {
  router.push(`/system/admin/assign-role/${row.id}`)
}

// 禁用/启用/恢复（确认类，保持原逻辑）
async function handleDisable(row: AdminUserItem) {
  try {
    await api.adminUser.disable(row.id)
    ElMessage.success('禁用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}
async function handleEnable(row: AdminUserItem) {
  try {
    await api.adminUser.enable(row.id)
    ElMessage.success('启用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}
async function handleRestore(row: AdminUserItem) {
  try {
    await api.adminUser.restore(row.id)
    ElMessage.success('恢复成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}
</script>

<style lang="scss" scoped>
.action-link {
  font-size: 14px;
  color: #5a9cf8;

  &:hover {
    color: #2d7de6;
  }
}
</style>
