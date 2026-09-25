<template>
  <!-- :methods 覆盖内置 CRUD 行为：新增/详情跳转独立页面（弹窗改页面） -->
  <CrudTable
    ref="crudTableRef"
    :schema="adminUserSchema"
    :api="api.adminUser"
    :methods="crudMethods"
    resource="admin"
  >
    <!-- 行内操作：编辑/禁用/启用/恢复/分配角色（分配角色改为跳转独立页面） -->
    <template #row-actions-extra="{ row }">
      <el-button v-if="!row.deleted && can('update')" link class="action-link" @click="goEdit(row)">
        <el-icon><Edit /></el-icon>编辑
      </el-button>
      <!-- 自身保护：当前登录账号不能禁用自己，故不显示禁用入口 -->
      <el-button
        v-if="!row.deleted && row.status === 1 && !isSelfRow(row) && can('disable')"
        link
        class="action-link"
        @click="handleDisable(row)"
      >
        <el-icon><Lock /></el-icon>禁用
      </el-button>
      <el-button
        v-if="!row.deleted && row.status === 0 && can('enable')"
        link
        class="action-link"
        @click="handleEnable(row)"
      >
        <el-icon><Unlock /></el-icon>启用
      </el-button>
      <el-button
        v-if="row.deleted && can('restore')"
        link
        class="action-link"
        @click="handleRestore(row)"
      >
        <el-icon><RefreshRight /></el-icon>恢复
      </el-button>
      <el-button
        v-if="!row.deleted && can('assign-role')"
        link
        class="action-link"
        @click="goAssignRole(row)"
      >
        <el-icon><Key /></el-icon>分配角色
      </el-button>
      <el-button
        v-if="!row.deleted && can('reset-password')"
        link
        class="action-link"
        @click="handleResetPassword(row)"
      >
        <el-icon><RefreshLeft /></el-icon>重置密码
      </el-button>
      <!-- 登录锁定：仅锁定态显示，解锁后账号可立即登录 -->
      <el-button
        v-if="!row.deleted && row.locked && can('unlock')"
        link
        class="action-link"
        @click="handleUnlock(row)"
      >
        <el-icon><Unlock /></el-icon>解锁
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
import { Edit, Lock, Unlock, RefreshRight, Key, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api'
import type { AdminUserItem } from '@/api'
import { CrudTable } from '@/components/CrudTable'
import { useResourcePermission } from '@/composables/use-permission'

import { adminUserSchema, isSelfRow } from './schema'

const router = useRouter()
const crudTableRef = ref<InstanceType<typeof CrudTable>>()

/** 行内按钮权限判定，口径同 ActionBar / DataArea 的自动拼接（本页 resource="admin"） */
const can = useResourcePermission('admin')

/** 刷新列表 */
function refreshList() {
  crudTableRef.value?.crud.fetchData()
}

// 表单类动作改路由跳转（弹窗 -> 页面）：工具栏与行内共用同一批跳转
const crudMethods = {
  onCreate: () => router.push('/system/admin/create'),
  onUpdate: (row: AdminUserItem) => goEdit(row),
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

/** 重置密码为系统默认密码（不可逆，先确认再执行） */
async function handleResetPassword(row: AdminUserItem) {
  try {
    await ElMessageBox.confirm(
      `确定将管理员「${row.username}」的密码重置为默认密码吗？`,
      '重置密码',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return // 用户取消
  }
  try {
    await api.adminUser.resetPassword(row.id)
    let pw = 'admin123'
    try {
      pw = await api.adminUser.defaultPassword()
    } catch {
      /* 接口异常时保留兜底提示文案 */
    }
    ElMessage.success(`密码已重置为默认密码：${pw}`)
  } catch {
    /* 请求工具已处理 */
  }
}

/** 解锁登录锁定：清除该账号的失败计数与锁定状态，解锁后可立即登录 */
async function handleUnlock(row: AdminUserItem) {
  try {
    await api.adminUser.unlock(row.id)
    ElMessage.success('解锁成功')
    refreshList()
  } catch {
    /* 请求工具已处理 */
  }
}
</script>

<style lang="scss" scoped>
/* 行内操作链接样式由基础样式表提供（.action-link），页面不再重复定义 */
</style>
