<template>
  <div ref="pageRef" class="admin-user-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input
            v-model="queryParams.realName"
            placeholder="请输入姓名"
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
        <el-form-item label="删除状态">
          <el-select
            v-model="queryParams.deleted"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未删除" :value="0" />
            <el-option label="已删除" :value="1" />
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
      <el-button type="warning" :disabled="!canBatchEdit" @click="handleBatchEdit">
        <el-icon><Edit /></el-icon>编辑
      </el-button>
      <el-button type="info" :disabled="selectedIds.length !== 1" @click="handleBatchDetail">
        <el-icon><View /></el-icon>详情
      </el-button>
      <el-button type="danger" :disabled="!hasNotDeletedSelected" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>删除
      </el-button>
      <el-button type="warning" :disabled="!hasNotDeletedSelected" @click="handleBatchDisable">
        <el-icon><Lock /></el-icon>禁用
      </el-button>
      <el-button type="success" :disabled="!hasNotDeletedSelected" @click="handleBatchEnable">
        <el-icon><Unlock /></el-icon>启用
      </el-button>
      <el-button type="success" :disabled="!hasDeletedSelected" @click="handleBatchRestore">
        <el-icon><RefreshRight /></el-icon>恢复
      </el-button>
      <el-button type="primary" :disabled="!canBatchEdit" @click="handleBatchAssignRole">
        <el-icon><Key /></el-icon>分配角色
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
        :height="tableHeight"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" width="130" show-overflow-tooltip />
        <el-table-column prop="realName" label="姓名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deleted" label="已删除" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.deleted ? 'danger' : 'info'" effect="plain">
              {{ row.deleted ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" align="center">
          <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.deleted" link class="action-link" @click="openEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link class="action-link" @click="openDetail(row)">
              <el-icon><View /></el-icon>详情
            </el-button>
            <el-popconfirm
              v-if="!row.deleted"
              title="确定删除该管理员吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button link class="action-link action-link--danger">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
            <el-button
              v-if="!row.deleted && row.status === 1"
              link
              class="action-link"
              @click="handleDisable(row)"
            >
              <el-icon><Lock /></el-icon>禁用
            </el-button>
            <el-button
              v-if="!row.deleted && row.status === 0"
              link
              class="action-link"
              @click="handleEnable(row)"
            >
              <el-icon><Unlock /></el-icon>启用
            </el-button>
            <el-button v-if="row.deleted" link class="action-link" @click="handleRestore(row)">
              <el-icon><RefreshRight /></el-icon>恢复
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="管理员详情" width="520px" destroy-on-close>
      <el-descriptions v-loading="detailLoading" :column="1" border>
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailData.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" effect="plain">
            {{ detailData.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="删除状态">
          <el-tag :type="detailData.deleted ? 'danger' : 'info'" effect="plain">
            {{ detailData.deleted ? '已删除' : '未删除' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          formatDate(detailData.createTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          formatDate(detailData.updateTime)
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '新增管理员'"
      width="520px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="20" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            maxlength="30"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入姓名" maxlength="20" />
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

    <!-- 分配角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="480px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div v-loading="roleLoading" class="role-assign-content">
        <p class="role-user-info">
          管理员：<strong>{{ currentUser?.username }}</strong>
          <span v-if="currentUser?.realName">（{{ currentUser.realName }}）</span>
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
        <el-empty v-if="roleList.length === 0 && !roleLoading" description="暂无可分配角色" />
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="handleAssignRole">
          {{ roleSubmitting ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  View,
  Lock,
  Unlock,
  RefreshRight,
  Key,
} from '@element-plus/icons-vue'
import {
  getAdminUserList,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  batchDeleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  restoreAdminUser,
  batchDisableAdminUser,
  batchEnableAdminUser,
  batchRestoreAdminUser,
  assignAdminRoles,
  getAdminRoleIds,
  getAllRoles,
  type AdminUserItem,
  type RoleItem,
} from '@/api/user'
import { formatDate } from '@/utils/date'

// ==================== 列表相关 ====================
const loading = ref(false)
const tableData = ref<AdminUserItem[]>([])
const total = ref(0)
const tableHeight = ref(400)
const pageRef = ref<{ clientHeight: number }>()

/** 计算表格高度，自适应窗口 */
function calcTableHeight() {
  nextTick(() => {
    if (!pageRef.value) return
    const pageHeight = pageRef.value.clientHeight
    // 搜索栏高度 + 分页高度 + 间距
    const otherHeight = 120
    tableHeight.value = pageHeight - otherHeight
  })
}
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  username: '',
  realName: '',
  status: undefined as number | undefined,
  deleted: undefined as number | undefined,
})

/** 获取列表数据 */
async function fetchData() {
  loading.value = true
  try {
    const result = await getAdminUserList(queryParams)
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
  queryParams.username = ''
  queryParams.realName = ''
  queryParams.status = undefined
  queryParams.deleted = undefined
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

/** 删除 */
async function handleDelete(id: number) {
  try {
    await deleteAdminUser(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 多选 */
const tableRef = ref<InstanceType<(typeof import('element-plus'))['ElTable']>>()
const selectedIds = ref<number[]>([])
const selectedRows = ref<AdminUserItem[]>([])

function handleSelectionChange(rows: AdminUserItem[]) {
  selectedRows.value = rows
  selectedIds.value = rows.map((r) => r.id)
}

/** 选中行中是否包含已删除用户 */
const hasDeletedSelected = computed(() => selectedRows.value.some((r) => r.deleted))

/** 选中行中是否包含未删除用户 */
const hasNotDeletedSelected = computed(() => selectedRows.value.some((r) => !r.deleted))

/** 是否可以批量编辑（仅选中1条未删除用户） */
const canBatchEdit = computed(
  () => selectedIds.value.length === 1 && !selectedRows.value[0]?.deleted,
)

/** 点击行切换选中状态（排除操作列点击） */
function handleRowClick(row: AdminUserItem, column: { property?: string; type?: string }) {
  // 操作列没有property，点击操作按钮时不切换选中
  if (column && column.property === undefined && column.type !== 'selection') return
  tableRef.value?.toggleRowSelection(row)
}

/** 批量删除（仅未删除用户） */
async function handleBatchDelete() {
  const ids = selectedRows.value.filter((r) => !r.deleted).map((r) => r.id)
  if (ids.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个管理员吗？`, '删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await batchDeleteAdminUser(ids)
    ElMessage.success('删除成功')
    selectedIds.value = []
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 批量编辑（选中单条未删除用户） */
function handleBatchEdit() {
  if (!canBatchEdit.value) return
  const row = tableData.value.find((r) => r.id === selectedIds.value[0])
  if (row) openEdit(row)
}

/** 批量查看详情（选中单条） */
function handleBatchDetail() {
  if (selectedIds.value.length !== 1) return
  const row = tableData.value.find((r) => r.id === selectedIds.value[0])
  if (row) openDetail(row)
}

/** 批量禁用（仅未删除用户） */
async function handleBatchDisable() {
  const ids = selectedRows.value.filter((r) => !r.deleted).map((r) => r.id)
  if (ids.length === 0) return
  try {
    await ElMessageBox.confirm(`确定禁用选中的 ${ids.length} 个管理员吗？`, '禁用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await batchDisableAdminUser(ids)
    ElMessage.success('禁用成功')
    selectedIds.value = []
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 批量启用（仅未删除用户） */
async function handleBatchEnable() {
  const ids = selectedRows.value.filter((r) => !r.deleted).map((r) => r.id)
  if (ids.length === 0) return
  try {
    await ElMessageBox.confirm(`确定启用选中的 ${ids.length} 个管理员吗？`, '启用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await batchEnableAdminUser(ids)
    ElMessage.success('启用成功')
    selectedIds.value = []
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 批量恢复（仅已删除用户） */
async function handleBatchRestore() {
  const ids = selectedRows.value.filter((r) => r.deleted).map((r) => r.id)
  if (ids.length === 0) return
  try {
    await ElMessageBox.confirm(`确定恢复选中的 ${ids.length} 个管理员吗？`, '恢复', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await batchRestoreAdminUser(ids)
    ElMessage.success('恢复成功')
    selectedIds.value = []
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 单条禁用 */
async function handleDisable(row: AdminUserItem) {
  try {
    await disableAdminUser(row.id)
    ElMessage.success('禁用成功')
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 单条启用 */
async function handleEnable(row: AdminUserItem) {
  try {
    await enableAdminUser(row.id)
    ElMessage.success('启用成功')
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 单条恢复 */
async function handleRestore(row: AdminUserItem) {
  try {
    await restoreAdminUser(row.id)
    ElMessage.success('恢复成功')
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

// ==================== 详情 ====================
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = reactive<AdminUserItem>({
  id: 0,
  username: '',
  realName: '',
  status: 1,
  deleted: false,
  createTime: '',
  updateTime: '',
})

/** 打开详情对话框 */
async function openDetail(row: AdminUserItem) {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const data = await getAdminUserDetail(row.id)
    Object.assign(detailData, data)
  } catch {
    Object.assign(detailData, row)
  } finally {
    detailLoading.value = false
  }
}

// ==================== 新增/编辑表单 ====================
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defaultFormData = {
  id: undefined as number | undefined,
  username: '',
  password: '',
  realName: '',
  status: 1,
}

const formData = reactive({ ...defaultFormData })

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 30, message: '密码长度为4-30个字符', trigger: 'blur' },
  ],
  realName: [{ max: 20, message: '姓名最多20个字符', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

/** 打开新增对话框 */
function openCreate() {
  isEdit.value = false
  Object.assign(formData, { ...defaultFormData })
  formRef.value?.resetFields()
  dialogVisible.value = true
}

/** 打开编辑对话框 */
function openEdit(row: AdminUserItem) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    password: '',
    realName: row.realName || '',
    status: row.status,
  })
  formRef.value?.resetFields()
  dialogVisible.value = true
}

/** 重置表单 */
function resetForm() {
  Object.assign(formData, { ...defaultFormData })
  formRef.value?.resetFields()
}

/** 提交表单 */
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value && formData.id !== undefined) {
      await updateAdminUser(formData.id, {
        username: formData.username,
        realName: formData.realName,
        status: formData.status,
      })
      ElMessage.success('更新成功')
    } else {
      await createAdminUser({
        username: formData.username,
        password: formData.password,
        realName: formData.realName,
        status: formData.status,
      })
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

// ==================== 分配角色 ====================
const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSubmitting = ref(false)
const currentUser = ref<AdminUserItem | null>(null)
const roleList = ref<RoleItem[]>([])
const selectedRoleIds = ref<number[]>([])

/** 打开分配角色对话框 */
async function openAssignRole(row: AdminUserItem) {
  currentUser.value = row
  selectedRoleIds.value = []
  roleDialogVisible.value = true
  roleLoading.value = true
  try {
    const [roles, ids] = await Promise.all([getAllRoles(), getAdminRoleIds(row.id)])
    roleList.value = roles
    selectedRoleIds.value = ids
  } catch {
    roleList.value = []
    selectedRoleIds.value = []
  } finally {
    roleLoading.value = false
  }
}

/** 批量分配角色（选中单条未删除用户） */
function handleBatchAssignRole() {
  if (!canBatchEdit.value) return
  const row = tableData.value.find((r) => r.id === selectedIds.value[0])
  if (row && !row.deleted) openAssignRole(row)
}

/** 提交分配角色 */
async function handleAssignRole() {
  if (!currentUser.value) return
  roleSubmitting.value = true
  try {
    await assignAdminRoles(currentUser.value.id, selectedRoleIds.value)
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
  } catch {
    // 请求工具已处理错误提示
  } finally {
    roleSubmitting.value = false
  }
}

// ==================== 初始化 ====================
onMounted(() => {
  fetchData()
  calcTableHeight()
  window.addEventListener('resize', calcTableHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', calcTableHeight)
})
</script>

<style lang="scss" scoped>
.admin-user-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #1f2937;

  // 加深表格文字颜色
  :deep(.el-table) {
    color: #1f2937;

    th.el-table__cell {
      color: #111827;
      font-weight: 600;
    }
  }

  // 加深表单标签颜色
  :deep(.el-form-item__label) {
    color: #1f2937;
    font-weight: 500;
  }

  // 加深分页器颜色
  :deep(.el-pagination) {
    --el-pagination-button-color: #1f2937;
    --el-pagination-hover-color: #111827;
  }

  // 加深选择器文字
  :deep(.el-input__inner),
  :deep(.el-select .el-input__inner) {
    color: #1f2937;
  }
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
}

.search-bar {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.action-bar {
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-bottom: 8px;
}

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

.action-link {
  font-size: 14px;
  color: #5a9cf8;

  &:hover {
    color: #2d7de6;
  }

  &.action-link--danger {
    color: #f56c6c;

    &:hover {
      color: #e04040;
    }
  }
}
</style>
