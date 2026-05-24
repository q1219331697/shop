<template>
  <CrudPage ref="crudPageRef" :schema="roleSchema" @action="handleAction">
    <!-- 行操作追加：分配权限 -->
    <template #row-actions-extra="{ row }">
      <el-button link class="action-link" @click="openAssignPermission(row)">
        <el-icon><Key /></el-icon>分配权限
      </el-button>
    </template>
  </CrudPage>

  <!-- 分配权限对话框 -->
  <el-dialog
    v-model="permDialogVisible"
    title="分配权限"
    width="520px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div v-loading="permLoading" class="perm-assign-content">
      <p class="perm-role-info">
        角色：<strong>{{ currentRole?.roleName }}</strong>
      </p>
      <el-tree
        ref="permTreeRef"
        :data="permissionTree"
        :props="{ label: 'permissionName', children: 'children' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermIds"
        :default-expand-all="true"
      />
      <el-empty v-if="permissionTree.length === 0 && !permLoading" description="暂无可分配权限" />
    </div>
    <template #footer>
      <el-button @click="permDialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="permSubmitting" @click="handleAssignPermission">
        {{ permSubmitting ? '提交中...' : '确 定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 角色管理 - 基于 CrudPage 的标准 CRUD 页面
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import { CrudPage } from '@/components/CrudPage'
import type { CrudSchema } from '@/components/CrudPage'
import {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  batchDisableRole,
  batchEnableRole,
  assignRolePermissions,
  getRolePermissionIds,
  type RoleItem,
} from '@/api/role'
import { getPermissionTree, type PermissionItem } from '@/api/permission'

// ==================== CrudPage ref ====================
const crudPageRef = ref<InstanceType<typeof CrudPage>>()

/** Role CRUD Schema */
const roleSchema: CrudSchema<RoleItem, string> = {
  name: '角色',
  rowKey: 'id',

  // ---- 搜索区 ----
  searchFields: [
    { prop: 'roleName', label: '角色名称', type: 'input' },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '正常', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ],

  // ---- 按钮区 ----
  actions: {
    extraToolbar: [
      {
        action: 'disable',
        label: '禁用',
        icon: 'Lock',
        type: 'warning',
        disabled: (ctx) => !ctx.selectedRows.some((r: RoleItem) => r.status === 1),
      },
      {
        action: 'enable',
        label: '启用',
        icon: 'Unlock',
        type: 'success',
        disabled: (ctx) => !ctx.selectedRows.some((r: RoleItem) => r.status === 0),
      },
    ],
    rowActions: [],
  },

  // ---- 数据区 ----
  columns: [
    { prop: 'id', label: 'ID', width: 70, align: 'center' },
    { prop: 'roleName', label: '角色名称', width: 160, showOverflowTooltip: true },
    { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
    { prop: 'sortOrder', label: '排序', width: 80, align: 'center' },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      align: 'center',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    { prop: 'createTime', label: '创建时间', width: 170, align: 'center', type: 'date' },
    { prop: 'updateTime', label: '更新时间', width: 170, align: 'center', type: 'date' },
  ],
  rowActionsWidth: 200,

  // ---- 表单区 ----
  formFields: [
    { prop: 'roleName', label: '角色名称', type: 'input', required: true, maxlength: 50 },
    { prop: 'description', label: '描述', type: 'textarea', rows: 3, maxlength: 200 },
    { prop: 'sortOrder', label: '排序', type: 'number', min: 0, max: 9999 },
    {
      prop: 'status',
      label: '状态',
      type: 'radio',
      radios: [
        { label: '正常', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ],
  formRules: {
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 50, message: '角色名称长度为2-50个字符', trigger: 'blur' },
    ],
    sortOrder: [{ required: true, message: '请输入排序', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  },
  defaultFormData: {
    roleName: '',
    description: '',
    sortOrder: 0,
    status: 1,
  },

  // ---- 详情区 ----
  detailFields: [
    { prop: 'id', label: 'ID' },
    { prop: 'roleName', label: '角色名称' },
    { prop: 'description', label: '描述' },
    { prop: 'sortOrder', label: '排序' },
    {
      prop: 'status',
      label: '状态',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    { prop: 'createTime', label: '创建时间', type: 'date' },
    { prop: 'updateTime', label: '更新时间', type: 'date' },
  ],

  // ---- API ----
  listApi: getRoleList,
  detailApi: getRoleDetail,
  createApi: createRole,
  updateApi: updateRole,
  deleteApi: deleteRole,
}

// ==================== 自定义操作处理 ====================

/** 处理自定义操作（禁用/启用） */
async function handleAction(action: string, _data?: unknown) {
  const crud = crudPageRef.value?.crud
  if (!crud) return

  switch (action) {
    case 'disable': {
      const ids = (crud.selectedRows.value as RoleItem[])
        .filter((r) => r.status === 1)
        .map((r) => r.id)
      if (ids.length === 0) return
      try {
        await ElMessageBox.confirm(`确定禁用选中的 ${ids.length} 个角色吗？`, '禁用', {
          type: 'warning',
        })
      } catch {
        return
      }
      try {
        await batchDisableRole(ids)
        ElMessage.success('禁用成功')
        crud.fetchData()
      } catch {
        /* 请求工具已处理 */
      }
      break
    }
    case 'enable': {
      const ids = (crud.selectedRows.value as RoleItem[])
        .filter((r) => r.status === 0)
        .map((r) => r.id)
      if (ids.length === 0) return
      try {
        await ElMessageBox.confirm(`确定启用选中的 ${ids.length} 个角色吗？`, '启用', {
          type: 'warning',
        })
      } catch {
        return
      }
      try {
        await batchEnableRole(ids)
        ElMessage.success('启用成功')
        crud.fetchData()
      } catch {
        /* 请求工具已处理 */
      }
      break
    }
  }
}

// ==================== 分配权限 ====================
const permDialogVisible = ref(false)
const permLoading = ref(false)
const permSubmitting = ref(false)
const currentRole = ref<RoleItem | null>(null)
const permissionTree = ref<PermissionItem[]>([])
const checkedPermIds = ref<number[]>([])
const permTreeRef = ref()

/** 打开分配权限对话框 */
async function openAssignPermission(row: RoleItem) {
  currentRole.value = row
  checkedPermIds.value = []
  permDialogVisible.value = true
  permLoading.value = true
  try {
    const [tree, ids] = await Promise.all([getPermissionTree(), getRolePermissionIds(row.id)])
    permissionTree.value = tree || []
    checkedPermIds.value = getLeafIds(ids || [], tree || [])
  } catch {
    permissionTree.value = []
    checkedPermIds.value = []
  } finally {
    permLoading.value = false
  }
}

/** 获取叶子节点ID列表 */
function getLeafIds(ids: number[], tree: PermissionItem[]): number[] {
  const allIds = new Set(ids)
  const leafIds: number[] = []
  function traverse(nodes: PermissionItem[]) {
    for (const node of nodes) {
      if (allIds.has(node.id)) {
        if (!node.children || node.children.length === 0) {
          leafIds.push(node.id)
        }
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  traverse(tree)
  return leafIds
}

/** 提交分配权限 */
async function handleAssignPermission() {
  if (!currentRole.value) return
  permSubmitting.value = true
  try {
    const tree = permTreeRef.value
    const checkedKeys = tree.getCheckedKeys()
    const halfCheckedKeys = tree.getHalfCheckedKeys()
    const allKeys = [...checkedKeys, ...halfCheckedKeys]
    await assignRolePermissions(currentRole.value.id, allKeys)
    ElMessage.success('分配权限成功')
    permDialogVisible.value = false
  } catch {
    // 请求工具已处理错误提示
  } finally {
    permSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.perm-assign-content {
  min-height: 120px;
  max-height: 400px;
  overflow-y: auto;
}

.perm-role-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;

  strong {
    color: #303133;
  }
}

.action-link {
  font-size: 14px;
  color: #5a9cf8;

  &:hover {
    color: #2d7de6;
  }
}
</style>
