<template>
  <div ref="pageRef" class="admin-role-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 按钮区 -->
    <div class="action-bar">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>新增
      </el-button>
      <el-button type="warning" :disabled="selectedIds.length !== 1" @click="openEditSelected">
        <el-icon><Edit /></el-icon>编辑
      </el-button>
      <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>删除
      </el-button>
      <el-button type="warning" :disabled="!hasEnabledSelected" @click="handleBatchDisable">
        <el-icon><Lock /></el-icon>禁用
      </el-button>
      <el-button type="success" :disabled="!hasDisabledSelected" @click="handleBatchEnable">
        <el-icon><Unlock /></el-icon>启用
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="roleName" label="角色名称" width="160" show-overflow-tooltip />

        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" align="center">
          <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="120"
          align="center"
          fixed="right"
          class-name="table-action-col"
        >
          <template #default="{ row }">
            <el-button link class="action-link" @click="openAssignPermission(row)">
              <el-icon><Key /></el-icon>分配权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" maxlength="50" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入角色描述"
            maxlength="200"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, Key, Lock, Unlock } from '@element-plus/icons-vue'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  disableRole,
  enableRole,
  assignRolePermissions,
  getRolePermissionIds,
  type RoleItem,
} from '@/api/role'
import { getPermissionTree, type PermissionItem } from '@/api/permission'
import { formatDate } from '@/utils/date'

// ==================== 列表相关 ====================
const loading = ref(false)
const tableData = ref<RoleItem[]>([])
const total = ref(0)
const tableRef = ref()
const selectedIds = ref<number[]>([])
const selectedRows = ref<RoleItem[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  status: undefined as number | undefined,
})

/** 获取列表数据 */
async function fetchData() {
  loading.value = true
  try {
    const result = await getRoleList(queryParams)
    tableData.value = result.list
    total.value = result.total
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleSearch() {
  queryParams.pageNum = 1
  fetchData()
}

/** 重置 */
function handleReset() {
  queryParams.roleName = ''
  queryParams.status = undefined
  queryParams.pageNum = 1
  queryParams.pageSize = 10
  fetchData()
}

/** 分页变化 */
function handlePageChange(page: number) {
  queryParams.pageNum = page
  fetchData()
}

/** 每页条数变化 */
function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchData()
}

/** 选择变化 */
function handleSelectionChange(rows: RoleItem[]) {
  selectedRows.value = rows
  selectedIds.value = rows.map((r) => r.id)
}

/** 点击行切换选中状态（排除操作列点击） */
function handleRowClick(row: RoleItem, column: { property?: string; type?: string }) {
  // 操作列没有property，点击操作按钮时不切换选中
  if (column && column.property === undefined && column.type !== 'selection') return
  tableRef.value?.toggleRowSelection(row)
}

/** 编辑选中行 */
function openEditSelected() {
  if (selectedRows.value.length !== 1) return
  openEdit(selectedRows.value[0])
}

/** 选中行中是否包含启用状态的角色 */
const hasEnabledSelected = computed(() => selectedRows.value.some((r) => r.status === 1))

/** 选中行中是否包含禁用状态的角色 */
const hasDisabledSelected = computed(() => selectedRows.value.some((r) => r.status === 0))

/** 批量删除 */
function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个角色吗？`, '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await Promise.all(selectedIds.value.map((id) => deleteRole(id)))
        ElMessage.success('删除成功')
        fetchData()
      } catch {
        // 请求工具已处理错误提示
      }
    })
    .catch(() => {})
}

/** 批量禁用 */
function handleBatchDisable() {
  const ids = selectedRows.value.filter((r) => r.status === 1).map((r) => r.id)
  if (ids.length === 0) return
  ElMessageBox.confirm(`确定禁用选中的 ${ids.length} 个角色吗？`, '禁用', { type: 'warning' })
    .then(async () => {
      try {
        await Promise.all(ids.map((id) => disableRole(id)))
        ElMessage.success('禁用成功')
        fetchData()
      } catch {
        // 请求工具已处理错误提示
      }
    })
    .catch(() => {})
}

/** 批量启用 */
function handleBatchEnable() {
  const ids = selectedRows.value.filter((r) => r.status === 0).map((r) => r.id)
  if (ids.length === 0) return
  ElMessageBox.confirm(`确定启用选中的 ${ids.length} 个角色吗？`, '启用', { type: 'warning' })
    .then(async () => {
      try {
        await Promise.all(ids.map((id) => enableRole(id)))
        ElMessage.success('启用成功')
        fetchData()
      } catch {
        // 请求工具已处理错误提示
      }
    })
    .catch(() => {})
}

// ==================== 表单相关 ====================
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const currentEditId = ref<number | null>(null)

const formData = reactive({
  roleName: '',
  description: '',
  sortOrder: 0,
  status: 1,
})

const formRules = reactive<FormRules>({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

/** 新增角色 */
function openCreate() {
  isEdit.value = false
  currentEditId.value = null
  formData.roleName = ''
  formData.description = ''
  formData.sortOrder = 0
  formData.status = 1
  dialogVisible.value = true
}

/** 编辑角色 */
function openEdit(row: RoleItem) {
  isEdit.value = true
  currentEditId.value = row.id
  formData.roleName = row.roleName
  formData.description = row.description || ''
  formData.sortOrder = row.sortOrder
  formData.status = row.status
  dialogVisible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    const data = { ...formData }
    if (isEdit.value && currentEditId.value) {
      await updateRole(currentEditId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createRole(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  } finally {
    submitting.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formRef.value?.resetFields()
  currentEditId.value = null
}

// ==================== 分配权限相关 ====================
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
  permDialogVisible.value = true
  permLoading.value = true
  try {
    // 并行加载权限树和角色已有权限
    const [tree, ids] = await Promise.all([getPermissionTree(), getRolePermissionIds(row.id)])
    permissionTree.value = tree || []
    // 只设置叶子节点为选中状态，避免父节点自动勾选问题
    checkedPermIds.value = getLeafIds(ids || [], tree || [])
  } catch {
    permissionTree.value = []
    checkedPermIds.value = []
  } finally {
    permLoading.value = false
  }
}

/** 获取叶子节点ID列表（el-tree 设置 checked 时只需要叶子节点） */
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
    // 获取全选和半选的节点ID
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.admin-role-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.search-bar {
  margin-bottom: 12px;
}

.action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.action-link {
  padding: 4px 8px;
  font-size: 13px;
}

.action-link--danger {
  color: var(--el-color-danger);
}

.action-link--danger:hover {
  color: var(--el-color-danger-light-3);
}

.perm-assign-content {
  max-height: 400px;
  overflow-y: auto;
}

.perm-role-info {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
</style>
