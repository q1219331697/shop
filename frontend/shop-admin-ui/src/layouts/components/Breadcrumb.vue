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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/**
 * 面包屑匹配链。
 *
 * 子页面（新增/编辑/详情/分配）是静态注册在 Layout 下的独立路由，不在菜单树里，
 * 其 route.matched 只有自身一条，左上角会丢掉「系统管理 / 角色管理」前缀；
 * 因此用 meta.activeMenu 解析出所属列表页的匹配链补在前面。
 */
const breadcrumbs = computed(() => {
  const current = route.matched.filter((item) => item.meta?.title)
  const activeMenu = route.meta.activeMenu as string | undefined
  if (!activeMenu) return current

  const parent = router
    .resolve(activeMenu)
    .matched.filter((item) => item.meta?.title && item.name !== 'NotFound')
  return parent.length > 0 ? [...parent, ...current] : current
})
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
