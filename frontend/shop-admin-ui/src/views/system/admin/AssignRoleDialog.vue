<template>
  <el-dialog
    v-model="visible"
    title="分配角色"
    width="480px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="role-assign-content">
      <p class="role-user-info">
        管理员：<strong>{{ currentAdminUser?.username }}</strong>
        <span v-if="currentAdminUser?.realName">（{{ currentAdminUser.realName }}）</span>
      </p>
      <el-checkbox-group v-model="selectedRoleIds">
        <el-checkbox
          v-for="role in roleList"
          :key="role.id"
          :value="role.id"
          :label="role.roleName"
          class="role-checkbox"
        />
      </el-checkbox-group>
      <el-empty v-if="roleList.length === 0 && !loading" description="暂无可分配角色" />
    </div>
    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '确 定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 分配角色对话框
 * 状态内聚：通过 open(row) 打开
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  assignAdminRoles,
  getAdminRoleIds,
  getAllRoles,
  type AdminUserItem,
  type RoleItem,
} from '@/api/admin-user'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = ref(false)
const currentAdminUser = ref<AdminUserItem | null>(null)
const loading = ref(false)
const submitting = ref(false)
const roleList = ref<RoleItem[]>([])
const selectedRoleIds = ref<number[]>([])

/** 打开分配角色对话框 */
function open(row: AdminUserItem) {
  currentAdminUser.value = row
  selectedRoleIds.value = []
  visible.value = true
}

/** 加载角色数据 */
async function loadRoles() {
  if (!currentAdminUser.value) return
  loading.value = true
  try {
    const [roles, ids] = await Promise.all([
      getAllRoles(),
      getAdminRoleIds(currentAdminUser.value.id),
    ])
    roleList.value = roles
    selectedRoleIds.value = ids
  } catch {
    roleList.value = []
    selectedRoleIds.value = []
  } finally {
    loading.value = false
  }
}

/** 提交分配角色 */
async function handleSubmit() {
  if (!currentAdminUser.value) return
  submitting.value = true
  try {
    await assignAdminRoles(currentAdminUser.value.id, selectedRoleIds.value)
    ElMessage.success('角色分配成功')
    visible.value = false
    emit('success')
  } catch {
    // 请求工具已处理错误提示
  } finally {
    submitting.value = false
  }
}

/** 监听对话框打开时加载角色数据 */
watch(visible, (val) => {
  if (val) loadRoles()
})

defineExpose({ open })
</script>

<style lang="scss" scoped>
.role-assign-content {
  min-height: 120px;
}

.role-user-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;

  strong {
    color: #303133;
  }
}

.role-checkbox {
  display: block;
  margin-bottom: 12px;
}
</style>
