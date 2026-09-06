<template>
  <!-- :methods 可覆盖内置 CRUD 行为，如：:methods="{ onCreate: handleCreate, onUpdate: handleUpdate, onDelete: handleDelete }" -->
  <CrudTable
    ref="crudTableRef"
    :schema="adminUserSchema"
    :api="api.adminUser"
    :handlers="toolbarHandlers"
  >
    <!-- 行操作追加：禁用/启用/恢复/分配角色 -->
    <template #row-actions-extra="{ row }">
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
      <el-button
        v-if="!row.deleted"
        link
        class="action-link"
        @click="assignRoleDialogRef?.open(row)"
      >
        <el-icon><Key /></el-icon>分配角色
      </el-button>
    </template>
  </CrudTable>

  <!-- 分配角色对话框 -->
  <AssignRoleDialog ref="assignRoleDialogRef" @success="refreshList" />
</template>

<script setup lang="ts">
/**
 * 管理员管理 - 基于 CrudTable 的 CRUD 页面
 * <p>
 * 管理后台账号（AdminUserEntity），区别于 C 端会员（UserEntity）。
 * </p>
 */

// ==================== 依赖引入 ====================

// Vue 核心
import { Lock, Unlock, RefreshRight, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

// API 聚合对象（显式导入，避免依赖 auto-import 在该视图未注入）
import { api } from '@/api'

// Element Plus

// 业务组件
import type { AdminUserItem } from '@/api'
import { CrudTable } from '@/components/CrudTable'
import type { ActionContext } from '@/components/CrudTable'

import AssignRoleDialog from './AssignRoleDialog.vue'

// Schema 配置
import { adminUserSchema } from './schema'

// 类型
// API 通过自动导入的 api 聚合对象使用（无需 import）

// ==================== 组件引用 ====================

const crudTableRef = ref<InstanceType<typeof CrudTable>>()
const assignRoleDialogRef = ref<InstanceType<typeof AssignRoleDialog>>()

// ==================== 通用方法 ====================

/** 刷新列表 */
function refreshList() {
  crudTableRef.value?.crud.fetchData()
}

// ==================== 工具栏按钮 handler ====================

/** 分配角色（disabled 已保证选中1条且未删除） */
function handleAssignRole(ctx: ActionContext<AdminUserItem>) {
  assignRoleDialogRef.value?.open(ctx.selectedRows[0])
}

/** 工具栏按钮 handler 映射（只配需要组件交互的，其余已在 schema 中配置） */
const toolbarHandlers = {
  assignRole: handleAssignRole,
}

// ==================== 行操作 ====================

/** 禁用管理员 */
async function handleDisable(row: AdminUserItem) {
  try {
    await api.adminUser.disable(row.id)
    ElMessage.success('禁用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}

/** 启用管理员 */
async function handleEnable(row: AdminUserItem) {
  try {
    await api.adminUser.enable(row.id)
    ElMessage.success('启用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}

/** 恢复管理员 */
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
