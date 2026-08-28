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
import { nextTick, ref, watch } from 'vue'
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import { assignRolePermissions, getRolePermissionIds, type RoleItem } from '@/api/role'
import { getPermissionTree, type PermissionItem } from '@/api/permission'

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
      getPermissionTree(),
      getRolePermissionIds(currentRole.value.id),
    ])
    permissionTree.value = tree
    await nextTick()
    // 回显已选权限（仅叶子节点，父节点由 check-strictly=false 自动联动）
    treeRef.value?.setCheckedKeys(ids)
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
    const permissionIds: number[] = [...checkedKeys, ...halfCheckedKeys]
    await assignRolePermissions(currentRole.value.id, permissionIds)
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
