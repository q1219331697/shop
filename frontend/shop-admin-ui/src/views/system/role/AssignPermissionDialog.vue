<template>
  <el-dialog
    v-model="visible"
    title="分配权限"
    width="520px"
    destroy-on-close
    :close-on-click-modal="false"
  >
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
 * 分配权限对话框
 * 状态内聚：通过 open(row) 打开，加载权限树并回显当前角色已选权限
 */
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import { nextTick, ref, watch } from 'vue'

import type { RoleItem, PermissionItem } from '@/api'
// API 通过自动导入的 api 聚合对象使用（无需 import）

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = ref(false)
const currentRole = ref<RoleItem | null>(null)
const loading = ref(false)
const submitting = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const permissionTree = ref<PermissionItem[]>([])

/** 树形控件配置 */
const treeProps = {
  children: 'children',
  label: 'permissionName',
}

/**
 * 收集权限树中所有叶子节点的 ID
 *
 * 父节点（目录/菜单）的勾选状态由 el-tree 依据子节点自动推导，
 * 因此回显时只需要给出「被勾选的叶子节点」，父节点会自然呈现全选或半选。
 */
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

/** 打开分配权限对话框 */
function open(row: RoleItem) {
  currentRole.value = row
  visible.value = true
}

/** 加载权限树与角色已选权限 */
async function loadPermissions() {
  if (!currentRole.value) return
  loading.value = true
  try {
    const [tree, ids] = await Promise.all([
      api.permission.tree(),
      api.role.getPermissionIds(currentRole.value.id),
    ])
    permissionTree.value = tree
    await nextTick()
    // 只回显叶子节点：非严格模式（check-strictly=false）下，若把父节点也交给 setCheckedKeys，
    // el-tree 会把父节点视为「全选」并级联勾选其全部子节点，
    // 表现为「只勾了一个最底层权限，重新打开却勾选了所有同级权限」。
    // 父节点的全选/半选状态由 el-tree 依据已勾选的叶子节点自动推导，无需显式设置。
    const leafIds = collectLeafIds(tree)
    treeRef.value?.setCheckedKeys(ids.filter((id) => leafIds.has(Number(id))))
  } catch {
    permissionTree.value = []
  } finally {
    loading.value = false
  }
}

/** 提交分配权限 */
async function handleSubmit() {
  if (!currentRole.value) return
  submitting.value = true
  try {
    const checkedKeys: number[] = (treeRef.value?.getCheckedKeys(false) ?? []).map((k) => Number(k))
    const halfCheckedKeys: number[] = (treeRef.value?.getHalfCheckedKeys() ?? []).map((k) =>
      Number(k),
    )
    // 半选父节点必须一并提交：菜单树由父节点（目录/菜单）构建，缺失会导致菜单不展示。
    // 半选父节点与全选子节点可能重复，故去重后再提交。
    const permissionIds: number[] = [...new Set([...checkedKeys, ...halfCheckedKeys])]
    await api.role.assignPermissions(currentRole.value.id, permissionIds)
    ElMessage.success('权限分配成功')
    visible.value = false
    emit('success')
  } catch {
    // 请求工具已处理错误提示
  } finally {
    submitting.value = false
  }
}

/** 监听对话框打开时加载权限数据 */
watch(visible, (val) => {
  if (val) loadPermissions()
})

defineExpose({ open })
</script>

<style lang="scss" scoped>
.permission-assign-content {
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
</style>
