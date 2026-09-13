<template>
  <div class="page-container">
    <!-- 搜索区 -->
    <div v-if="$slots.search" class="page-container__search">
      <slot name="search" />
    </div>

    <!-- 按钮区 -->
    <div v-if="$slots.actions" class="page-container__actions">
      <slot name="actions" />
    </div>

    <!-- 数据展示区（仅在使用该插槽时占位，否则 flex:1 会撑出大片空白、把默认插槽内容顶到页面底部） -->
    <div v-if="$slots.data" class="page-container__data">
      <slot name="data" />
    </div>

    <!-- 默认插槽：对话框等浮层 -->
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * PageContainer - 统一页面布局壳
 *
 * 提供：
 * 1. 统一的 flex 布局容器
 * 2. 统一的样式重置（表格文字加深、表单标签加深、分页器加深等）
 * 3. 统一的 slot 分区：search / actions / data / default(对话框)
 */
</script>

<style lang="scss" scoped>
// ============================================================
// 页面布局规格（全站列表页统一在此定义，页面里不要再各写一套）
// - $section-spacing：搜索区/按钮区 与 表格 之间的留白（加在区块下外边距）
// - $search-row-gap：搜索条件换行时的行间距
// - --row-height：表格行高（默认 40px），由 DataArea 按 props.rowHeight 注入
// ============================================================
$section-spacing: 12px;
$search-row-gap: 8px;

.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  color: #1f2937;

  // 加深表格文字颜色 + 统一表格规格（页面内的任意 el-table 都生效，含自定义树形表格）
  :deep(.el-table) {
    color: #1f2937;

    th.el-table__cell {
      padding: 8px 0;
      color: #111827;
      font-weight: 600;
    }

    td.el-table__cell {
      padding: 4px 0;
      // td 的 height 是「最小行高」语义：内容更高时行会自然变高
      height: var(--row-height, 40px);
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

.page-container__search {
  margin-bottom: $section-spacing;

  // 搜索条件换行成多行时，行与行之间保留间距（row-gap 只作用于换行处，
  // 单行搜索不会产生多余的下方空白）
  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    row-gap: $search-row-gap;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.page-container__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: $section-spacing;
}

.page-container__data {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
