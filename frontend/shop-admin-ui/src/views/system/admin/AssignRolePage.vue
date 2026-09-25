<template>
  <SubPage :loading="loading" body-class="role-assign-content" footer-class="role-assign-footer">
    <InfoBar
      label="管理员"
      :value="currentAdminUser?.username"
      :extra="currentAdminUser?.realName"
    />
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

    <template #footer>
      <el-button @click="goBack">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确 定</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 管理员 - 分配角色页（弹窗改页面）
 * <p>从 AssignRoleDialog 迁移为独立页面，逻辑保持一致。</p>
 * <p>骨架（边距 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type AdminUserItem, type RoleItem } from '@/api'
import InfoBar from '@/components/InfoBar.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/admin） */
const { goBackToList } = usePageNav()

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
      api.adminUser.roleIds(uid),
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
    goBackToList()
  } catch {
    /* 请求工具已处理 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  goBackToList()
}
</script>

<style lang="scss" scoped>
/* 顶部信息行由 InfoBar + 基础样式 .info-bar 提供，此处只保留本页的角色勾选样式 */
.role-checkbox {
  display: block;
  margin-bottom: 12px;
}
</style>
