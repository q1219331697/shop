<template>
  <PageContainer>
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
      <div class="role-assign-footer">
        <el-button @click="goBack">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * 管理员 - 分配角色页（弹窗改页面）
 * <p>从 AssignRoleDialog 迁移为独立页面，逻辑保持一致。</p>
 */
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, type AdminUserItem, type RoleItem } from '@/api'

const route = useRoute()
const router = useRouter()

const currentAdminUser = ref<AdminUserItem | null>(null)
const loading = ref(false)
const submitting = ref(false)
const roleList = ref<RoleItem[]>([])
const selectedRoleIds = ref<number[]>([])

onMounted(async () => {
  const raw = route.params.id
  if (!raw) return
  const uid = Number(raw)
  loading.value = true
  try {
    const [user, roles, ids] = await Promise.all([
      api.adminUser.detail(uid),
      api.role.all(),
      api.adminUser.getRoleIds(uid),
    ])
    currentAdminUser.value = user
    roleList.value = roles
    selectedRoleIds.value = ids
  } catch {
    roleList.value = []
    selectedRoleIds.value = []
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (!currentAdminUser.value) return
  submitting.value = true
  try {
    await api.adminUser.assignRoles(currentAdminUser.value.id, selectedRoleIds.value)
    ElMessage.success('角色分配成功')
    router.back()
  } catch {
    /* 请求工具已处理 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.role-assign-content {
  padding: 16px;
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

.role-assign-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
