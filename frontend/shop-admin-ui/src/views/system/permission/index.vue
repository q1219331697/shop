<template>
  <div ref="pageRef" class="admin-permission-page">
    <!-- 按钮区 -->
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
        :data="flatData"
        border
        row-key="id"
        fit
        height="100%"
        highlight-current-row
        @row-click="handleRowClick"
      >
        <el-table-column width="55" align="center">
          <template #header>
            <el-checkbox disabled />
          </template>
          <template #default="{ row }">
            <el-checkbox
              :model-value="currentRow?.id === row.id"
              @change="handleCheckChange(row)"
              @click.stop
            />
          </template>
        </el-table-column>
        <el-table-column prop="permissionName" label="权限名称" min-width="260">
          <template #default="{ row }">
            <span
              v-for="(item, idx) in row._level > 0 ? row._treeLines || [] : []"
              :key="idx"
              class="tree-line"
              >{{ item }}</span
            >
            <span
              v-if="row._hasChildren"
              class="tree-expand-icon"
              @click.stop="toggleExpand(row)"
              >{{ expandedKeys.has(row.id) ? '▼' : '▶' }}</span
            >
            <span v-else class="tree-expand-indent" />
            <span>{{ row.permissionName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCode" label="权限编码" width="240" />
        <el-table-column prop="permissionType" label="类型" align="center">
          <template #default="{ row }">
            <el-tag :type="row.permissionType === 1 ? 'primary' : 'warning'" effect="plain">
              {{ row.permissionType === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="160">
          <template #default="{ row }">
            <span v-if="row.permissionType === 1">{{ row.path || '-' }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" width="200">
          <template #default="{ row }">
            <span v-if="row.permissionType === 1">{{ row.component || '-' }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <template v-if="row.permissionType === 1">
              <el-icon v-if="row.icon" :size="18"><component :is="row.icon" /></el-icon>
              <span v-else>-</span>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" align="center" />
        <el-table-column prop="visible" label="可见" width="80" align="center">
          <template #default="{ row }">
            <template v-if="row.permissionType === 1">
              <el-tag :type="row.visible === 1 ? 'success' : 'info'" effect="plain">
                {{ row.visible === 1 ? '显示' : '隐藏' }}
              </el-tag>
            </template>
            <span v-else class="text-muted">-</span>
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
            node-key="id"
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
          <el-input v-model="formData.path" placeholder="如：/system/permission" />
        </el-form-item>
        <el-form-item v-if="formData.permissionType === 1" label="组件路径">
          <el-input v-model="formData.component" placeholder="如：views/system/permission/index" />
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
const expandedKeys = ref<Set<number>>(new Set())

/** 扁平化数据：根据展开状态将树形数据展开为一维列表，去掉children防止el-table自动生成展开箭头 */
const flatData = computed(() => {
  const result: PermissionItem[] = []
  function walk(list: PermissionItem[]) {
    list.forEach((item) => {
      const { children, ...rest } = item
      result.push(rest)
      if (item._hasChildren && expandedKeys.value.has(item.id) && children) {
        walk(children)
      }
    })
  }
  walk(tableData.value)
  return result
})

/** checkbox 单选切换 */
function handleCheckChange(row: PermissionItem) {
  if (currentRow.value?.id === row.id) {
    currentRow.value = null
    tableRef.value?.setCurrentRow()
  } else {
    currentRow.value = row
    tableRef.value?.setCurrentRow(row)
  }
}

/** 行点击：选中行，菜单行同时切换展开/折叠 */
function handleRowClick(row: PermissionItem) {
  // 选中逻辑
  if (currentRow.value?.id === row.id) {
    currentRow.value = null
    tableRef.value?.setCurrentRow()
  } else {
    currentRow.value = row
    tableRef.value?.setCurrentRow(row)
  }
  // 菜单行同时切换展开/折叠
  if (row.permissionType === 1 && row._hasChildren) {
    toggleExpand(row)
  }
}

/** 给树数据添加 _level、_isLast、_treeLines、_hasChildren 属性 */
function addLevelToTree(
  list: PermissionItem[],
  level = 0,
  parentLines: string[] = [],
): PermissionItem[] {
  return list.map((item, index) => {
    const isLast = index === list.length - 1
    // 将当前层级的分支符号也放入 treeLines，统一用 tree-line 渲染，确保对齐
    const treeLines = [...parentLines, isLast ? '└' : '├']
    const hasChildren = !!(item.children && item.children.length)
    const newItem = {
      ...item,
      _level: level,
      _isLast: isLast,
      _treeLines: treeLines,
      _hasChildren: hasChildren,
    }
    if (hasChildren && item.children) {
      // 子节点的 parentLines：在当前 treeLines 基础上，把最后一个(├/└)替换为│
      const childLines = [...treeLines.slice(0, -1), '│']
      newItem.children = addLevelToTree(item.children, level + 1, childLines)
    }
    return newItem
  })
}

/** 切换展开/折叠 */
function toggleExpand(row: PermissionItem) {
  if (expandedKeys.value.has(row.id)) {
    expandedKeys.value.delete(row.id)
  } else {
    expandedKeys.value.add(row.id)
  }
}

/** 获取权限树数据 */
async function fetchData() {
  loading.value = true
  try {
    const data = await getPermissionTree()
    tableData.value = addLevelToTree(data || [])
    // 默认展开全部
    if (expandAll.value) {
      collectAllParentKeys(tableData.value)
    }
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/** 收集所有父节点key */
function collectAllParentKeys(list: PermissionItem[]) {
  list.forEach((item) => {
    if (item._hasChildren) {
      expandedKeys.value.add(item.id)
      collectAllParentKeys(item.children || [])
    }
  })
}

/** 展开/折叠切换 */
function handleExpandChange(val: string | number | boolean) {
  expandedKeys.value.clear()
  if (val) {
    collectAllParentKeys(tableData.value)
  }
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

.text-muted {
  color: #c0c4cc;
}

/* 第一列checkbox居中 */
:deep(.el-table td:first-child .cell),
:deep(.el-table th:first-child .cell) {
  text-align: center !important;
  padding: 0 !important;
}

:deep(.el-table td:first-child .cell .el-checkbox),
:deep(.el-table th:first-child .cell .el-checkbox) {
  margin-right: 0 !important;
  vertical-align: middle !important;
}

.tree-line {
  display: inline-block;
  width: 10px;
  text-align: center;
  vertical-align: middle;
  font-size: 12px;
  color: #c8cdd5;
  line-height: 1;
  font-family: monospace;
}

.tree-expand-icon {
  cursor: pointer;
  display: inline-block;
  width: 10px;
  text-align: center;
  vertical-align: middle;
  font-size: 12px;
  color: #8a9099;
  user-select: none;
  line-height: 1;
}

.tree-expand-icon:hover {
  color: var(--el-color-primary);
}

.tree-expand-indent {
  display: inline-block;
  width: 10px;
}

:deep(.el-table .el-table__cell) {
  padding-left: 4px;
  padding-right: 4px;
  white-space: nowrap;
}

/* 紧凑表格样式 - 使用CSS变量全局控制 */
:deep(.el-table) {
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-header-height: 40px;
  --el-table-row-height: 38px;
  --el-table-cell-padding: 0;
}

:deep(.el-table .el-table__body-wrapper .el-table__body tr),
:deep(.el-table .el-table__body-wrapper .el-table__body tr.el-table__row),
:deep(.el-table .el-table__body-wrapper .el-table__body tr.el-table__row--level-0),
:deep(.el-table .el-table__body-wrapper .el-table__body tr.el-table__row--level-1),
:deep(.el-table .el-table__body-wrapper .el-table__body tr.el-table__row--level-2),
:deep(.el-table .el-table__body-wrapper .el-table__body tr.el-table__row--level-3) {
  height: 38px !important;
  max-height: 38px !important;
}

:deep(.el-table .el-table__body-wrapper .el-table__body td),
:deep(.el-table .el-table__body-wrapper .el-table__body td.el-table__cell) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  height: 38px !important;
  max-height: 38px !important;
}

:deep(.el-table .el-table__header-wrapper .el-table__header th),
:deep(.el-table .el-table__header-wrapper .el-table__header th.el-table__cell) {
  height: 40px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

:deep(.el-table .el-table__body-wrapper .el-table__body td .cell),
:deep(.el-table .el-table__body-wrapper .el-table__body td.el-table__cell .cell) {
  line-height: 36px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 36px !important;
  max-height: 36px !important;
}

:deep(.el-table .el-table__header-wrapper .el-table__header th .cell),
:deep(.el-table .el-table__header-wrapper .el-table__header th.el-table__cell .cell) {
  line-height: 36px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 36px !important;
  max-height: 36px !important;
}

/* 紧凑表格内组件尺寸 */
:deep(.el-table .el-table__body .el-tag) {
  height: 20px !important;
  padding: 0 6px !important;
  line-height: 18px !important;
  font-size: 12px !important;
}

:deep(.el-table .el-table__body .el-checkbox) {
  height: 20px !important;
}

:deep(.el-table .el-table__body .el-checkbox__inner) {
  width: 14px !important;
  height: 14px !important;
}

:deep(.el-table .el-table__body .el-icon) {
  font-size: 16px !important;
}
</style>
