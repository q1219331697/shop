<template>
  <p class="info-bar">
    <span class="info-bar__label">{{ label }}：</span>
    <strong>{{ value }}</strong>
    <span v-if="extra" class="info-bar__extra">（{{ extra }}）</span>
  </p>
</template>

<script setup lang="ts">
/**
 * InfoBar - 页面顶部信息提示行
 *
 * 任务页（分配角色 / 分配权限等）在内容顶部展示「操作对象」是谁，
 * 例如「管理员：admin（超级管理员）」「角色：超级管理员」。
 * 样式由基础样式表 .info-bar 提供，页面不再各自定义。
 */
withDefaults(
  defineProps<{
    /** 标签文案，如「管理员」「角色」 */
    label: string
    /** 主要值（名称 / 账号） */
    value?: string
    /** 补充说明，渲染为括号内容 */
    extra?: string
  }>(),
  {
    value: '',
    extra: '',
  },
)
</script>
