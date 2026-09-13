<template>
  <PageContainer>
    <!-- 搜索区 -->
    <template #search>
      <SearchBar
        v-model:query-params="queryParamsModel"
        :fields="permissionSearchFields"
        :show-buttons="true"
        @search="handleSearch"
        @reset="handleReset"
      />
    </template>

    <!-- 按钮区 -->
    <template #actions>
      <ActionBar
        :actions="permissionToolbarActions"
        :context="actionContext"
        @action="handleToolbarAction"
      >
        <template #toolbar-suffix>
          <el-button :icon="Sort" @click="handleToggleExpand">
            {{ expanded ? '全部折叠' : '全部展开' }}
          </el-button>
          <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
        </template>
      </ActionBar>
    </template>

    <!-- 数据展示区：权限树形表格（无分页） -->
    <template #data>
      <div ref="dataRef" v-loading="loading" class="permission-table">
        <el-table
          ref="tableRef"
          :data="tableData"
          row-key="id"
          :tree-props="{ children: 'children' }"
          border
          stripe
          :max-height="maxHeight"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />

          <el-table-column
            prop="permissionName"
            label="权限名称"
            min-width="200"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <el-icon v-if="row.icon" class="permission-icon">
                <component :is="row.icon" />
              </el-icon>
              {{ row.permissionName }}
            </template>
          </el-table-column>

          <el-table-column
            prop="permissionCode"
            label="权限编码"
            min-width="180"
            show-overflow-tooltip
          />

          <el-table-column prop="permissionType" label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="typeTag(row.permissionType)[1]" effect="plain">
                {{ typeTag(row.permissionType)[0] }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="path" label="路径" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <template v-if="row.permissionType !== 3">{{ row.path || '-' }}</template>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="component" label="组件路径" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <template v-if="row.permissionType !== 3">{{ row.component || '-' }}</template>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="sortOrder" label="排序" width="80" align="center" />

          <el-table-column prop="visible" label="可见" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="visibleTag(row.visible)[1]" effect="plain">
                {{ visibleTag(row.visible)[0] }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)[1]" effect="plain">
                {{ statusTag(row.status)[0] }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" width="170" align="center">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>

          <!-- 宽度按「新增下级/编辑/详情/删除」四个行内按钮单行排布取整，避免换行把行高撑到 40 以上 -->
        <el-table-column label="操作" width="300" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.permissionType === 1"
                link
                class="action-link"
                @click="handleCreateChild(row)"
              >
                <el-icon><Plus /></el-icon>新增下级
              </el-button>
              <el-button link class="action-link" @click="handleEditRow(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button link class="action-link" @click="handleDetailRow(row)">
                <el-icon><View /></el-icon>详情
              </el-button>
              <el-button link class="action-link action-link--danger" @click="handleDeleteRow(row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无权限数据" />
          </template>
        </el-table>
      </div>
    </template>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * 权限管理 - 树形权限维护页面
 *
 * 权限天然是树形结构且后端仅提供全量树接口（无分页），
 * 因此不使用 CrudTable 的分页表格，而是基于 useCrud 自由组装：
 * PageContainer + SearchBar + ActionBar + 树形表格。
 *
 * 交互形态（弹窗改页面）：新增/编辑/详情跳转独立页面；删除保持原位确认。
 */
import { Delete, Edit, Plus, Refresh, Sort, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { PermissionItem, PermissionTreeResult } from '@/api'
import { PageContainer, SearchBar, ActionBar } from '@/components/CrudTable'
import type { TagMap } from '@/components/CrudTable/types'
import { useCrud } from '@/composables/use-crud'
import { useTableMaxHeight } from '@/composables/use-table-height'
import { formatDate } from '@/utils/date'
import { getPermissionList, invalidatePermissionTreeCache } from '@/utils/permissionTree'

import {
  PERMISSION_TYPE_TAG_MAP,
  STATUS_TAG_MAP,
  VISIBLE_TAG_MAP,
  permissionSearchFields,
  permissionToolbarActions,
} from './schema'

/** 标签类型（与 Element Plus el-tag 的 type 取值保持一致） */
type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

// ==================== 通用方法 ====================

/** 取标签文案与类型，未命中时返回占位 */
function resolveTag(map: TagMap, value: unknown, fallback = '未知'): [string, TagType] {
  const matched = map[value as string | number]
  if (!matched) {
    return [fallback, 'info']
  }
  return [matched[0], matched[1] as TagType]
}

/** 权限类型标签 */
function typeTag(value: unknown): [string, TagType] {
  return resolveTag(PERMISSION_TYPE_TAG_MAP, value)
}

/** 可见状态标签 */
function visibleTag(value: unknown): [string, TagType] {
  return resolveTag(VISIBLE_TAG_MAP, value)
}

/** 状态标签 */
function statusTag(value: unknown): [string, TagType] {
  return resolveTag(STATUS_TAG_MAP, value)
}

// ==================== CRUD 核心 ====================

/**
 * 列表请求包装：在 fetchData 内部已经调过的同一份全量树（getPermissionList 内部已缓存），
 * 这里把原始树同步到 permissionTree，避免再独立调用一次 getPermissionTree。
 */
async function listApiWithTree(
  params: Parameters<typeof getPermissionList>[0],
): Promise<PermissionTreeResult> {
  const result = await getPermissionList(params)
  if (result.rawTree) {
    permissionTree.value = result.rawTree
  }
  return result
}

const router = useRouter()

const {
  loading,
  tableData,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handleSelectionChange,
  selectedRows,
  selectedIds,
  actionContext,
  handleToolbarAction: crudHandleToolbarAction,
  handleBatchDelete,
} = useCrud<PermissionItem>({
  listApi: listApiWithTree,
  detailApi: api.permission.detail,
  createApi: api.permission.create,
  updateApi: api.permission.update,
  deleteApi: api.permission.delete,
  searchFields: permissionSearchFields,
  rowKey: 'id',
})

/** 完整权限树（由列表请求填充，供后续页面使用） */
const permissionTree = ref<PermissionItem[]>([])

/**
 * 查询参数双向绑定代理：
 * SearchBar 通过 v-model:query-params 更新参数，若直接绑定 queryParams 会被替换为新对象，
 * 导致 useCrud 内部闭包引用的 reactive 对象无法感知搜索条件（搜索失效）。
 * 这里用 computed 就地合并回原 reactive 对象，保证 handleSearch/fetchData 读到最新条件。
 */
const queryParamsModel = computed({
  get: () => queryParams,
  set: (val: Record<string, unknown>) => {
    Object.keys(queryParams).forEach((key) => {
      if (!(key in val)) {
        queryParams[key] = undefined
      }
    })
    Object.assign(queryParams, val)
  },
})

// ==================== 树形表格展开控制 ====================

const tableRef = ref()

/** 数据区容器：表格高度上限由它计算（公共约定，见 useTableMaxHeight；本页无分页） */
const dataRef = ref<HTMLElement>()
const { maxHeight } = useTableMaxHeight(dataRef)
/** 是否处于全部展开状态 */
const expanded = ref(true)

/** 应用展开状态（树数据刷新后需重新展开，行对象是新的引用） */
function applyExpandState() {
  void nextTick(() => {
    flattenPermissionTreeForExpand(tableData.value).forEach((row) => {
      tableRef.value?.toggleRowExpansion(row, expanded.value)
    })
  })
}

/** 扁平化树形表格数据（仅用于展开控制，复用工具函数） */
function flattenPermissionTreeForExpand(nodes: PermissionItem[]): PermissionItem[] {
  const result: PermissionItem[] = []
  const walk = (list: PermissionItem[]) => {
    for (const node of list) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return result
}

/** 切换全部展开/折叠 */
function handleToggleExpand() {
  expanded.value = !expanded.value
  applyExpandState()
}

/** 数据变化后同步展开状态 */
watch(tableData, () => {
  applyExpandState()
})

// ==================== 操作 ====================

/** 刷新列表与权限树 */
async function handleRefresh() {
  invalidatePermissionTreeCache()
  await fetchData()
}

/** 工具栏操作：表单类跳转独立页面，删除走确认 */
async function handleToolbarAction(action: string) {
  if (action === 'delete') {
    invalidatePermissionTreeCache()
    await handleToolbarDelete()
    return
  }
  if (action === 'create') {
    router.push('/system/permission/create')
    return
  }
  const row = selectedRows.value[0] as PermissionItem | undefined
  if (!row) return
  if (action === 'edit') {
    router.push(`/system/permission/edit/${row.id}`)
    return
  }
  if (action === 'detail') {
    router.push(`/system/permission/detail/${row.id}`)
    return
  }
  await crudHandleToolbarAction(action)
}

/** 编辑单行 -> 页面 */
function handleEditRow(row: PermissionItem) {
  router.push(`/system/permission/edit/${row.id}`)
}
/** 新增下级权限 -> 页面并预填上级 */
function handleCreateChild(row: PermissionItem) {
  router.push(`/system/permission/create?parentId=${row.id}`)
}
/** 详情 -> 页面 */
function handleDetailRow(row: PermissionItem) {
  router.push(`/system/permission/detail/${row.id}`)
}

/**
 * 工具栏删除：与行内删除使用同一种确认提示，
 * 单选时提示具体权限名，与行内按钮文案保持一致；多选时与通用批量删除一致。
 */
async function handleToolbarDelete() {
  if (selectedIds.value.length === 0) return
  if (selectedIds.value.length === 1) {
    const row = selectedRows.value[0] as PermissionItem
    try {
      await ElMessageBox.confirm(`确定删除权限「${row.permissionName}」吗？`, '删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }
    try {
      await api.permission.delete(row.id)
      ElMessage.success('删除成功')
      await fetchData()
    } catch {
      /* 请求工具已处理错误提示 */
    }
    return
  }
  await handleBatchDelete()
}

/** 删除单行：使用与工具栏一致的确认提示文案 */
async function handleDeleteRow(row: PermissionItem) {
  try {
    await ElMessageBox.confirm(`确定删除权限「${row.permissionName}」吗？`, '删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await api.permission.delete(row.id)
    ElMessage.success('删除成功')
    invalidatePermissionTreeCache()
    await fetchData()
  } catch {
    /* 请求工具已处理错误提示 */
  }
}

// ==================== 初始化 ====================

onMounted(() => {
  void handleRefresh()
})
</script>

<style lang="scss" scoped>
.permission-table {
  width: 100%;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  // 树形表格同样按内容高度渲染、超出 max-height 才内部滚动（与其他列表页一致）
  :deep(.el-table) {
    flex: none;
  }
}

.permission-icon {
  margin-right: 6px;
  vertical-align: -2px;
  color: #5a9cf8;
}

.action-link {
  font-size: 14px;
  color: #5a9cf8;
  /* 保证按钮文本不换行 */
  white-space: nowrap;

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
