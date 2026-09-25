<template>
  <SubPage
    :loading="loading"
    body-max-height="420px"
    body-class="permission-assign-content"
    footer-class="permission-assign-footer"
  >
    <InfoBar label="角色" :value="currentRole?.roleName" />
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

    <template #footer>
      <el-button @click="goBack">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确 定</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 角色 - 分配权限页（弹窗改页面）
 * <p>从 AssignPermissionDialog 迁移为独立页面，逻辑保持一致。</p>
 * <p>骨架（边距 / 底部操作区）统一由 SubPage 提供。</p>
 */
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import { nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type PermissionItem, type RoleItem } from '@/api'
import InfoBar from '@/components/InfoBar.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/role） */
const { goBackToList } = usePageNav()

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
      api.permission.list(),
      api.role.permissionIds(rid),
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
    goBackToList()
  } catch {
    /* 请求工具已处理错误提示 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  goBackToList()
}
</script>
