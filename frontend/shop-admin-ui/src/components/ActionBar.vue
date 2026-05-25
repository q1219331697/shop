<template>
  <div class="action-bar">
    <!-- 工具栏前缀插槽 -->
    <slot name="toolbar-prefix" />

    <!-- 工具栏按钮 -->
    <template v-for="item in resolvedToolbar" :key="item.action">
      <!-- 有确认提示的按钮 -->
      <el-popconfirm
        v-if="getConfirmText(item)"
        :title="getConfirmText(item)!"
        :disabled="isDisabled(item)"
        @confirm="handleAction(item.action)"
      >
        <template #reference>
          <el-button :type="item.type || 'default'" :disabled="isDisabled(item)">
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            {{ item.label }}
          </el-button>
        </template>
      </el-popconfirm>

      <!-- 普通按钮 -->
      <el-button
        v-else
        :type="item.type || 'default'"
        :disabled="isDisabled(item)"
        @click="handleAction(item.action)"
      >
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        {{ item.label }}
      </el-button>
    </template>

    <!-- 工具栏后缀插槽 -->
    <slot name="toolbar-suffix" />
  </div>
</template>

<script setup lang="ts">
/**
 * ActionBar - 按钮区组件
 *
 * 不配置 actions 时，默认显示：新增/编辑/详情/删除
 * 配置 actions 后，完全按配置渲染
 *
 * 支持：
 * - 内置默认按钮（零配置即完整）
 * - 自定义按钮列表
 * - disabled / visible 函数
 * - confirm 确认提示
 * - toolbar-prefix / toolbar-suffix 插槽
 */
import { computed } from 'vue'
import { Plus, Edit, View, Delete } from '@element-plus/icons-vue'
import type { ActionItem, ActionContext } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 操作按钮配置，不配置则使用默认4个按钮 */
    actions?: ActionItem[]
    /** 追加到默认/自定义按钮后面的额外按钮 */
    extraActions?: ActionItem[]
    /** 操作上下文 */
    context?: ActionContext
  }>(),
  {
    actions: undefined,
    extraActions: undefined,
    context: () => ({
      selectedRows: [],
      selectedIds: [],
      selectedCount: 0,
      loading: false,
      refresh: () => {},
    }),
  },
)

const emit = defineEmits<{
  (e: 'action', action: string): void
}>()

/** 默认工具栏按钮 */
const defaultToolbar: ActionItem[] = [
  { action: 'create', label: '新增', icon: Plus, type: 'primary' },
  {
    action: 'edit',
    label: '编辑',
    icon: Edit,
    type: 'warning',
    disabled: (ctx) => ctx.selectedCount !== 1,
  },
  {
    action: 'detail',
    label: '详情',
    icon: View,
    type: 'info',
    disabled: (ctx) => ctx.selectedCount !== 1,
  },
  {
    action: 'delete',
    label: '删除',
    icon: Delete,
    type: 'danger',
    disabled: (ctx) => ctx.selectedCount === 0,
    confirm: (ctx) => `确定删除选中的 ${ctx.selectedCount} 条数据吗？`,
  },
]

/** 解析后的工具栏按钮列表 */
const resolvedToolbar = computed(() => {
  const base = props.actions ?? defaultToolbar
  const items = [...base, ...(props.extraActions ?? [])]
  return items.filter((item) => {
    if (typeof item.visible === 'function') {
      return item.visible(props.context)
    }
    return item.visible !== false
  })
})

/** 判断按钮是否禁用 */
function isDisabled(item: ActionItem): boolean {
  if (typeof item.disabled === 'function') {
    return item.disabled(props.context)
  }
  return item.disabled === true
}

/** 获取确认提示文本 */
function getConfirmText(item: ActionItem): string | undefined {
  if (typeof item.confirm === 'function') {
    return item.confirm(props.context)
  }
  return item.confirm
}

/** 触发操作事件：有 handler 直接调用，无 handler 走默认 emit 分发 */
function handleAction(action: string) {
  const item = resolvedToolbar.value.find((i) => i.action === action)
  if (item?.handler) {
    // 按钮配了自定义 handler，直接调用，传入 ActionContext
    item.handler(props.context)
  } else {
    // 没配 handler，走默认行为，由 CrudTable 内置逻辑处理
    emit('action', action)
  }
}
</script>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
