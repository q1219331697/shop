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

    <!-- 数据展示区 -->
    <div class="page-container__data">
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
$section-spacing: 12px;

.page-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
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

.page-container__search {
  margin-bottom: $section-spacing;

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
