<template>
  <div ref="rootRef" class="data-area data-container" :style="rowHeightStyle">
    <!-- 完全替换数据展示区（如树形表格） -->
    <slot v-if="$slots['data-content']" name="data-content" :loading="loading" />

    <!-- 标准表格 -->
    <template v-else>
      <!-- 表格顶部插槽 -->
      <slot name="table-top" />

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="data"
        :border="border"
        :stripe="stripe"
        :row-key="rowKey"
        :max-height="maxHeight"
        :highlight-current-row="highlightCurrentRow"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <!-- 多选列：rowSelectable 返回 false 的行复选框禁用（el-table 的行点击切换同样遵循该判断） -->
        <el-table-column
          v-if="selectable"
          type="selection"
          width="50"
          align="center"
          :selectable="rowSelectable"
        />

        <!-- 展开行 -->
        <el-table-column v-if="expandable || $slots['table-expand']" type="expand">
          <template #default="{ row }">
            <slot name="table-expand" :row="row" />
          </template>
        </el-table-column>

        <!-- 数据列 -->
        <template v-for="col in visibleColumns" :key="col.prop">
          <el-table-column
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align"
            :fixed="col.fixed"
            :show-overflow-tooltip="col.showOverflowTooltip"
          >
            <template #default="{ row }">
              <!-- 列级插槽 -->
              <slot
                v-if="col.slot"
                :name="`column-${col.slot}`"
                :row="row"
                :value="row[col.prop]"
                :column="col"
              />

              <!-- type: tag -->
              <template v-else-if="col.type === 'tag'">
                <el-tag
                  v-if="getTagInfo(col, row[col.prop])"
                  :type="getTagInfo(col, row[col.prop])![1]"
                  effect="plain"
                >
                  {{ getTagInfo(col, row[col.prop])![0] }}
                </el-tag>
                <span v-else>{{ row[col.prop] ?? '-' }}</span>
              </template>

              <!-- type: date -->
              <template v-else-if="col.type === 'date'">
                {{ formatDate(row[col.prop], col.dateFormat) }}
              </template>

              <!-- type: boolean -->
              <template v-else-if="col.type === 'boolean'">
                <el-tag
                  :type="row[col.prop] ? col.trueType || 'success' : col.falseType || 'info'"
                  effect="plain"
                >
                  {{ row[col.prop] ? col.trueText || '是' : col.falseText || '否' }}
                </el-tag>
              </template>

              <!-- type: money -->
              <template v-else-if="col.type === 'money'">
                {{ formatMoney(row[col.prop], col.prefix, col.precision) }}
              </template>

              <!-- type: image -->
              <template v-else-if="col.type === 'image'">
                <el-image
                  v-if="row[col.prop]"
                  :src="row[col.prop]"
                  :preview-src-list="[row[col.prop]]"
                  :style="{
                    width: (col.imageWidth || 40) + 'px',
                    height: (col.imageHeight || 40) + 'px',
                  }"
                  fit="cover"
                  preview-teleported
                />
                <span v-else>-</span>
              </template>

              <!-- type: index -->
              <template v-else-if="col.type === 'index'">
                {{ row.$index != null ? row.$index + 1 : '-' }}
              </template>

              <!-- type: default + formatter -->
              <template v-else-if="col.formatter">
                {{ col.formatter(row[col.prop], row, col) }}
              </template>

              <!-- type: default -->
              <template v-else>
                {{ row[col.prop] ?? '-' }}
              </template>
            </template>
          </el-table-column>
        </template>

        <!-- 操作区（行操作列） -->
        <el-table-column
          v-if="
            resolvedRowActions.length > 0 || $slots['row-actions'] || $slots['row-actions-extra']
          "
          :label="'操作'"
          :width="rowActionsWidth"
          align="center"
          :fixed="rowActionsFixed"
        >
          <template #default="{ row }">
            <!-- 完全替换行操作 -->
            <slot v-if="$slots['row-actions']" name="row-actions" :row="row" />

            <!-- 自动渲染行操作 -->
            <template v-else>
              <template v-for="item in resolvedRowActions" :key="item.action">
                <!-- 有确认提示 -->
                <el-popconfirm
                  v-if="getRowConfirmText(item, row) && isRowActionVisible(item, row)"
                  :title="getRowConfirmText(item, row)!"
                  @confirm="handleRowAction(item.action, row)"
                >
                  <template #reference>
                    <el-button
                      link
                      :class="['action-link', item.type === 'danger' ? 'action-link--danger' : '']"
                    >
                      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                      {{ item.label }}
                    </el-button>
                  </template>
                </el-popconfirm>

                <!-- 普通按钮 -->
                <el-button
                  v-else-if="isRowActionVisible(item, row)"
                  link
                  :class="['action-link', item.type === 'danger' ? 'action-link--danger' : '']"
                  @click="handleRowAction(item.action, row)"
                >
                  <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                  {{ item.label }}
                </el-button>
              </template>
            </template>

            <!-- 行操作追加插槽 -->
            <slot name="row-actions-extra" :row="row" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="pagination" ref="paginationRef" class="data-area__pagination">
        <slot
          name="pagination"
          :total="pagination.total"
          :page-num="pagination.pageNum"
          :page-size="pagination.pageSize"
        >
          <el-pagination
            :current-page="pagination.pageNum"
            :page-size="pagination.pageSize"
            :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * DataArea - 数据展示区组件
 *
 * 支持：
 * - 配置驱动的列渲染（tag/date/boolean/money/image/index/default）
 * - 列级插槽 #column-{slot|prop}
 * - 展开行 #table-expand
 * - 行操作按钮（默认：编辑/详情/删除）
 * - 分页
 * - 完全替换数据展示 #data-content（如树形表格）
 */
import { Edit, View, Delete } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'

import { hasPermission } from '@/composables/use-permission'
import { useTableMaxHeight } from '@/composables/use-table-height'
import { formatDate } from '@/utils/date'

import type { TableColumn, ActionItem, RowData, TagType } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 表格列配置 */
    columns: TableColumn[]
    /** 数据源 */
    data: RowData[]
    /** 行唯一键 */
    rowKey?: string | (() => string)
    /** 是否加载中 */
    loading?: boolean
    /** 是否支持多选 */
    selectable?: boolean
    /** 多选列按行判断是否可勾选（对应 el-table-column type=selection 的 selectable） */
    rowSelectable?: (row: RowData) => boolean
    /** 是否支持展开行 */
    expandable?: boolean
    /** 行高（px，固定值，默认 40） */
    rowHeight?: number
    /** 是否显示边框 */
    border?: boolean
    /** 是否显示斑马纹 */
    stripe?: boolean
    /** 是否高亮当前行 */
    highlightCurrentRow?: boolean

    /** 分页信息 */
    pagination?: {
      total: number
      pageNum: number
      pageSize: number
      pageSizes?: number[]
    }

    /** 行操作按钮配置 */
    rowActions?: ActionItem[]
    /** 行操作列宽度 */
    rowActionsWidth?: number | string
    /** 行操作列固定 */
    rowActionsFixed?: 'left' | 'right' | boolean
    /**
     * 资源名，用于自动拼接行操作按钮权限码 `system:{resource}:{action}`，
     * 口径与 ActionBar 保持一致，避免「工具栏藏了、行内还在」的漏拦。
     */
    resource?: string
  }>(),
  {
    rowKey: 'id',
    loading: false,
    selectable: true,
    expandable: false,
    rowHeight: 40,
    border: true,
    stripe: true,
    highlightCurrentRow: false,
    rowActionsWidth: 200,
    rowActionsFixed: 'right',
  },
)

const emit = defineEmits<{
  (e: 'selection-change', rows: RowData[]): void
  (e: 'row-click', row: RowData, column: RowData): void
  (e: 'page-change' | 'size-change', value: number): void
  (e: 'action', action: string, row: RowData): void
}>()

const tableRef = ref()
const rootRef = ref<HTMLElement>()
const paginationRef = ref<HTMLElement>()

/** 表格高度上限（公共约定，见 useTableMaxHeight）：内容自适应，超出才内部滚动 */
const { maxHeight } = useTableMaxHeight(rootRef, paginationRef)

/** 默认行操作按钮 */
const defaultRowActions: ActionItem[] = [
  { action: 'update', label: '编辑', icon: Edit },
  { action: 'detail', label: '详情', icon: View },
  { action: 'delete', label: '删除', icon: Delete, type: 'danger', confirm: '确定删除吗？' },
]

/** 解析后的行操作按钮（叠加权限判定，口径同 ActionBar） */
const resolvedRowActions = computed(() => {
  const items = props.rowActions ?? defaultRowActions
  return items.filter((item) => {
    if (item.noPermission) return true
    const code =
      item.permission ?? (props.resource ? `system:${props.resource}:${item.action}` : null)
    // 未传 resource 或该动作无对应权限码时保持向后兼容，全部放行
    return code ? hasPermission(code) : true
  })
})

/** 过滤可见列 */
const visibleColumns = computed(() => {
  return props.columns.filter((col) => {
    if (typeof col.visible === 'function') {
      // 函数形式的 visible 需要行数据，在列级别无法判断，默认显示
      return true
    }
    return col.visible !== false
  })
})

/** 获取 Tag 信息 */
function getTagInfo(col: TableColumn, value: unknown): [string, TagType] | undefined {
  if (!col.tagMap) return undefined
  return col.tagMap[value as string | number]
}

/** 格式化金额 */
function formatMoney(value: unknown, prefix?: string, precision?: number): string {
  if (value == null) return '-'
  const p = prefix ?? '¥'
  const d = precision ?? 2
  const num = Number(value)
  if (isNaN(num)) return '-'
  return p + num.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 判断行操作按钮是否可见 */
function isRowActionVisible(item: ActionItem, _row: RowData): boolean {
  if (typeof item.visible === 'function') {
    return item.visible({
      selectedRows: [],
      selectedIds: [],
      selectedCount: 0,
      loading: false,
      refresh: () => {},
    })
  }
  return item.visible !== false
}

/** 获取行操作确认文本 */
function getRowConfirmText(item: ActionItem, _row: RowData): string | undefined {
  if (typeof item.confirm === 'function') {
    return item.confirm({
      selectedRows: [],
      selectedIds: [],
      selectedCount: 0,
      loading: false,
      refresh: () => {},
    })
  }
  return item.confirm
}

/** 多选变化 */
function handleSelectionChange(rows: RowData[]) {
  emit('selection-change', rows)
}

/** 行点击 */
function handleRowClick(row: RowData, column: RowData) {
  emit('row-click', row, column)
  // 默认行为：点击行切换选中（排除操作列和选择列）
  if (props.selectable && column) {
    if (column.property === undefined && column.type !== 'selection') return
    // 不可勾选的行（如「自身保护」）点击整行同样不选中：
    // el-table 暴露的 toggleRowSelection 不会走行级可勾选判断，故在此自行拦截
    if (props.rowSelectable && !props.rowSelectable(row)) return
    tableRef.value?.toggleRowSelection(row)
  }
}

/** 分页变化 */
function handlePageChange(page: number) {
  emit('page-change', page)
}

/** 每页条数变化 */
function handleSizeChange(size: number) {
  emit('size-change', size)
}

/** 行操作：有 handler 直接调用，无 handler 走默认 emit 分发 */
function handleRowAction(action: string, row: RowData) {
  const item = resolvedRowActions.value.find((i) => i.action === action)
  if (item?.handler) {
    // 按钮配了自定义 handler，直接调用，传入当前行数据
    item.handler(row)
  } else {
    // 没配 handler，走默认行为，由 CrudTable 内置逻辑处理
    emit('action', action, row)
  }
}

// ==================== 行高 ====================

/**
 * 行高固定值（px）：注入到公共变量 --row-height（PageContainer 统一消费，
 * td 设 height 即最小行高），保证所有列表页行高一致、可预期。
 */
const rowHeightStyle = computed(() => ({ '--row-height': `${props.rowHeight}px` }))

/** 暴露 tableRef 供外部使用 */
defineExpose({
  tableRef,
  toggleRowSelection: (row: RowData) => tableRef.value?.toggleRowSelection(row),
  setCurrentRow: (row: RowData) => tableRef.value?.setCurrentRow(row),
  clearSelection: () => tableRef.value?.clearSelection(),
})
</script>

<style lang="scss" scoped>
/* 数据区容器布局（撑满 / 按内容高度渲染 / 超出才内滚）与行内操作链接样式
   统一由基础样式表提供：.data-container、.action-link
   此处只保留分页样式 */
.data-area__pagination {
  display: flex;
  justify-content: flex-end;
  /* 表格与分页之间的留白加在这里（区块间距），不加在表格内部，避免行尾出现“空行”感 */
  margin-top: 12px;
  padding-bottom: 0;
}
</style>
