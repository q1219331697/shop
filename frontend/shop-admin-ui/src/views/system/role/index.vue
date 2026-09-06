<template>
  <!-- :methods 可覆盖内置 CRUD 行为，如：:methods="{ onCreate: handleCreate, onUpdate: handleUpdate, onDelete: handleDelete }" -->
  <CrudTable ref="crudTableRef" :schema="roleSchema" :api="api.role" :handlers="toolbarHandlers">
    <!-- 行操作追加：禁用/启用/分配权限 -->
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
      <el-button
        v-if="!row.deleted"
        link
        class="action-link"
        @click="assignPermissionDialogRef?.open(row)"
      >
        <el-icon><Key /></el-icon>分配权限
      </el-button>
    </template>
  </CrudTable>

  <!-- 分配权限对话框 -->
  <AssignPermissionDialog ref="assignPermissionDialogRef" @success="refreshList" />
</template>

<script setup lang="ts">
/**
 * 角色管理 - 基于 CrudTable 的 CRUD 页面
 */

// ==================== 依赖引入 ====================

// Vue 核心
import { Lock, Unlock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

// API 聚合对象（显式导入，避免依赖 auto-import 在该视图未注入）
import { api } from '@/api'

// Element Plus

// 业务组件
import type { RoleItem } from '@/api'
import { CrudTable } from '@/components/CrudTable'
import type { ActionContext } from '@/components/CrudTable'

import AssignPermissionDialog from './AssignPermissionDialog.vue'

// Schema 配置
import { roleSchema } from './schema'

// 类型
// API 通过自动导入的 api 聚合对象使用（无需 import）

// ==================== 组件引用 ====================

const crudTableRef = ref<InstanceType<typeof CrudTable>>()
const assignPermissionDialogRef = ref<InstanceType<typeof AssignPermissionDialog>>()

// ==================== 通用方法 ====================

/** 刷新列表 */
function refreshList() {
  crudTableRef.value?.crud.fetchData()
}

// ==================== 工具栏按钮 handler ====================

/** 分配权限（disabled 已保证选中1条且未删除） */
function handleAssignPermission(ctx: ActionContext<RoleItem>) {
  assignPermissionDialogRef.value?.open(ctx.selectedRows[0])
}

/** 工具栏按钮 handler 映射（只配需要组件交互的，其余已在 schema 中配置） */
const toolbarHandlers = {
  assignPermission: handleAssignPermission,
}

// ==================== 行操作 ====================

/** 禁用角色（错误提示由 http.ts 拦截器统一弹出，无需 try/catch） */
async function handleDisable(row: RoleItem) {
  await api.role.disable(row.id)
  ElMessage.success('禁用成功')
  refreshList()
}

/** 启用角色 */
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
  padding: 0;
  /* 保证按钮文本不换行 */
  white-space: nowrap;

  &:hover {
    color: #2d7de6;
  }
}
</style>
