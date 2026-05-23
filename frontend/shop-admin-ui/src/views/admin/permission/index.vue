<template>
  <div ref="pageRef" class="admin-permission-page">
    <!-- 操作区 -->
    <div class="action-bar">
      <el-button type="primary" @click="openCreate(0)">
        <el-icon><Plus /></el-icon>新增顶级权限
      </el-button>
      <el-button :disabled="!currentRow" @click="openEdit(currentRow!)">
        <el-icon><Edit /></el-icon>编辑
      </el-button>
      <el-popconfirm
        title="确定删除该权限吗？删除后不可恢复！"
        :disabled="!currentRow"
        @confirm="handleDelete(currentRow!.id)"
      >
        <template #reference>
          <el-button :disabled="!currentRow" type="danger" plain>
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </template>
      </el-popconfirm>
      <el-button @click="fetchData">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
      <el-switch
        v-model="expandAll"
        active-text="展开全部"
        inactive-text="折叠全部"
        style="margin-left: 12px"
        @change="handleExpandChange"
      />
    </div>

    <!-- 树形表格 -->
    <div class="table-wrapper">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        row-key="id"
        fit
        height="100%"
        highlight-current-row
        :default-expand-all="expandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @row-click="handleRowClick"
      >
        <el-table-column prop="permissionName" label="权限名称" width="200" />
        <el-table-column prop="permissionCode" label="权限编码" width="240" />
        <el-table-column prop="permissionType" label="类型" align="center">
          <template #default="{ row }">
            <el-tag :type="row.permissionType === 1 ? 'primary' : 'warning'" effect="plain">
              {{ row.permissionType === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="160" />
        <el-table-column prop="component" label="组件路径" width="200" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon" :size="18"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column prop="visible" label="可见" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'info'" effect="plain">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
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
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.permissionType === 1"
              link
              class="action-link"
              @click="openCreate(row.id)"
            >
              <el-icon><Plus /></el-icon>新增子权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="600px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentTreeOptions"
            :props="{ label: 'permissionName', children: 'children' }"
            placeholder="顶级权限"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权限类型" prop="permissionType">
          <el-radio-group v-model="formData.permissionType">
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="formData.permissionName" placeholder="请输入权限名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input
            v-model="formData.permissionCode"
            placeholder="如：system:permission:create"
            maxlength="100"
          />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="路由路径">
          <el-input v-model="formData.path" placeholder="如：/admin/permission" />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="组件路径">
          <el-input v-model="formData.component" placeholder="如：views/admin/permission/index" />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="图标">
          <IconSelect v-model="formData.icon" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="是否可见">
          <el-radio-group v-model="formData.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import IconSelect from '@/components/IconSelect.vue'
import {
  getPermissionTree,
  createPermission,
  updatePermission,
  deletePermission,
  type PermissionItem,
} from '@/api/permission'

// ==================== 列表相关 ====================
const loading = ref(false)
const tableData = ref<PermissionItem[]>([])
const expandAll = ref(true)
const tableRef = ref()
const currentRow = ref<PermissionItem | null>(null)
/** 行点击选中，再点取消 */
function handleRowClick(row: PermissionItem) {
  if (currentRow.value?.id === row.id) {
    currentRow.value = null
    tableRef.value?.setCurrentRow()
  } else {
    currentRow.value = row
    tableRef.value?.setCurrentRow(row)
  }
}

/** 获取权限树数据 */
async function fetchData() {
  loading.value = true
  try {
    const data = await getPermissionTree()
    tableData.value = data || []
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/** 展开/折叠切换 */
function handleExpandChange(val: string | number | boolean) {
  const table = tableRef.value
  if (!table) return
  const data = tableData.value
  function toggleExpand(rows: PermissionItem[]) {
    rows.forEach((row) => {
      table.toggleRowExpansion(row, val)
      if (row.children && row.children.length) {
        toggleExpand(row.children)
      }
    })
  }
  toggleExpand(data)
}

// ==================== 表单相关 ====================
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const currentEditId = ref<number | null>(null)

const defaultFormData = {
  parentId: 0,
  permissionName: '',
  permissionCode: '',
  permissionType: 1,
  path: '',
  component: '',
  icon: '',
  sortOrder: 0,
  visible: 1,
  status: 1,
}

const formData = reactive({ ...defaultFormData })

const formRules = reactive<FormRules>({
  permissionName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permissionCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

/** 上级权限树选项（增加顶级节点） */
const parentTreeOptions = computed(() => {
  const menuList = filterMenuPermissions(tableData.value)
  return [{ id: 0, permissionName: '顶级权限', children: menuList }]
})

/** 只过滤菜单类型的权限作为父级选项 */
function filterMenuPermissions(list: PermissionItem[]): PermissionItem[] {
  return list
    .filter((item) => item.permissionType === 1)
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuPermissions(item.children) : [],
    }))
}

/** 新增权限 */
function openCreate(parentId: number) {
  isEdit.value = false
  currentEditId.value = null
  Object.assign(formData, { ...defaultFormData, parentId, permissionType: parentId === 0 ? 1 : 2 })
  formRef.value?.resetFields()
  dialogVisible.value = true
}

/** 编辑权限 */
function openEdit(row: PermissionItem) {
  isEdit.value = true
  currentEditId.value = row.id
  Object.assign(formData, {
    parentId: row.parentId,
    permissionName: row.permissionName,
    permissionCode: row.permissionCode,
    permissionType: row.permissionType,
    path: row.path || '',
    component: row.component || '',
    icon: row.icon || '',
    sortOrder: row.sortOrder,
    visible: row.visible,
    status: row.status,
  })
  formRef.value?.resetFields()
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
      await updatePermission(currentEditId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createPermission(data)
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

/** 删除权限 */
async function handleDelete(id: number) {
  try {
    await deletePermission(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // 请求工具已处理错误提示
  }
}

/** 重置表单 */
function resetForm() {
  Object.assign(formData, { ...defaultFormData })
  formRef.value?.resetFields()
  currentEditId.value = null
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.admin-permission-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
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
  overflow: hidden;
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

:deep(.el-table .el-table__cell) {
  padding-left: 4px;
  padding-right: 4px;
  white-space: nowrap;
}
</style>
