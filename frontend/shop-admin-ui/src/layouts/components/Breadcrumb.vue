<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <!--
      面包屑是「我在哪」的位置指示，刻意不可点击，请勿加回 :to / href。
      其一：层级链含纯容器父级（如「系统管理」），它本身没有对应页面，开放点击会跳到空白页。
      其二：导航职责另有人承担 —— 跳转走侧栏菜单，任务页返回走 goBackToList（顶栏 .back-btn），
            用户不会被困在当前页，这里无需再提供一套跳转入口。
    -->
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
      {{ item.meta?.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { usePageNav } from '@/composables/use-page-nav'

/**
 * 面包屑层级链由 usePageNav 统一提供：
 * 与侧栏高亮、任务页标题读同一份路由元数据，保证三处位置指示一致。
 * 此处只取层级文本用于展示，不含任何跳转逻辑（刻意不可点击，原因见模板注释）。
 */
const { breadcrumbs } = usePageNav()
</script>

<style lang="scss" scoped>
.breadcrumb {
  font-size: 14px;

  // 面包屑不传 to，Element Plus 不会生成 .is-link，故无 hover 态（详见模板注释）
  :deep(.el-breadcrumb__inner) {
    color: #535966 !important;
  }

  :deep(.el-breadcrumb__separator) {
    color: #98a2b3;
  }
}
</style>
