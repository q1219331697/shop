<template>
  <!-- :methods 可覆盖内置 CRUD 行为，如：:methods="{ onCreate: handleCreate, onUpdate: handleUpdate, onDelete: handleDelete }" -->
  <CrudTable ref="crudTableRef" :schema="userSchema" :handlers="toolbarHandlers">
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
 * 管理员用户管理 - 基于 CrudTable 的 CRUD 页面
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Unlock, RefreshRight, Key } from '@element-plus/icons-vue'
import { CrudTable } from '@/components/CrudTable'
import { userSchema } from './schema'
import type { ActionContext } from '@/components/CrudTable'
import type { AdminUserItem } from '@/api/admin-user'
import { disableAdminUser, enableAdminUser, restoreAdminUser } from '@/api/admin-user'
import AssignRoleDialog from './AssignRoleDialog.vue'

// ==================== CrudTable ref ====================
const crudTableRef = ref<InstanceType<typeof CrudTable>>()

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

// ==================== 单条操作 ====================

async function handleDisable(row: AdminUserItem) {
  try {
    await disableAdminUser(row.id)
    ElMessage.success('禁用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}

async function handleEnable(row: AdminUserItem) {
  try {
    await enableAdminUser(row.id)
    ElMessage.success('启用成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}

async function handleRestore(row: AdminUserItem) {
  try {
    await restoreAdminUser(row.id)
    ElMessage.success('恢复成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}

// ==================== 分配角色对话框 ====================
const assignRoleDialogRef = ref<InstanceType<typeof AssignRoleDialog>>()
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
