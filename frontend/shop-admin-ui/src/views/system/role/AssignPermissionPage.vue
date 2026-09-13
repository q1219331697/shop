<template>
  <PageContainer>
    <template #actions>
      <el-button @click="goBack">返回</el-button>
    </template>
    <div v-loading="loading" class="permission-assign-content">
      <p class="permission-role-info">
        角色：<strong>{{ currentRole?.roleName }}</strong>
      </p>
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        :props="treeProps"
        node-key="id"
        show-checkbox
        default-expand-all
        :check-strictly="false"
      />
      <el-empty v-if="permissionTree.length === 0 && !loading" description="暂无可分配权限" />
      <div class="permission-assign-footer">
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
 * 角色 - 分配权限页（弹窗改页面）
 * <p>从 AssignPermissionDialog 迁移为独立页面，逻辑保持一致。</p>
 */
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, type PermissionItem, type RoleItem } from '@/api'

const route = useRoute()
const router = useRouter()

const currentRole = ref<RoleItem | null>(null)
const loading = ref(false)
const submitting = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const permissionTree = ref<PermissionItem[]>([])

const treeProps = {
  children: 'children',
  label: 'permissionName',
}

/** 收集权限树中所有叶子节点的 ID */
function collectLeafIds(nodes: PermissionItem[]): Set<number> {
  const leafIds = new Set<number>()
  const walk = (list: PermissionItem[]) => {
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        walk(node.children)
      } else {
        leafIds.add(Number(node.id))
      }
    }
  }
  walk(nodes)
  return leafIds
}

onMounted(async () => {
  const raw = route.params.id
  if (!raw) return
  const rid = Number(raw)
  loading.value = true
  try {
    const [role, tree, ids] = await Promise.all([
      api.role.detail(rid),
      api.permission.tree(),
      api.role.getPermissionIds(rid),
    ])
    currentRole.value = role
    permissionTree.value = tree
    await nextTick()
    const leafIds = collectLeafIds(tree)
    treeRef.value?.setCheckedKeys(ids.filter((id) => leafIds.has(Number(id))))
  } catch {
    permissionTree.value = []
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (!currentRole.value) return
  submitting.value = true
  try {
    const checkedKeys: number[] = (treeRef.value?.getCheckedKeys(false) ?? []).map((k) => Number(k))
    const halfCheckedKeys: number[] = (treeRef.value?.getHalfCheckedKeys() ?? []).map((k) =>
      Number(k),
    )
    const permissionIds: number[] = [...new Set([...checkedKeys, ...halfCheckedKeys])]
    await api.role.assignPermissions(currentRole.value.id, permissionIds)
    ElMessage.success('权限分配成功')
    router.back()
  } catch {
    /* 请求工具已处理错误提示 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.permission-assign-content {
  padding: 16px;
  min-height: 200px;
  max-height: 420px;
  overflow-y: auto;
}

.permission-role-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;

  strong {
    color: #303133;
  }
}

.permission-assign-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
