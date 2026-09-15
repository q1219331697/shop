<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <!-- 无组件的父级（如「系统管理」）不可点击，避免跳到空白页 -->
    <el-breadcrumb-item
      v-for="item in breadcrumbs"
      :key="item.path"
      :to="item.component ? item.path : undefined"
    >
      {{ item.meta?.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { usePageNav } from '@/composables/use-page-nav'

/**
 * 面包屑层级链由 usePageNav 统一提供：
 * 与侧栏高亮、任务页标题读同一份路由元数据，保证三处位置指示一致。
 */
const { breadcrumbs } = usePageNav()
</script>

<style lang="scss" scoped>
.breadcrumb {
  font-size: 14px;

  :deep(.el-breadcrumb__inner) {
    color: #535966 !important;

    &.is-link:hover {
      color: #006bb4 !important;
    }
  }

  :deep(.el-breadcrumb__separator) {
    color: #98a2b3;
  }
}
</style>
