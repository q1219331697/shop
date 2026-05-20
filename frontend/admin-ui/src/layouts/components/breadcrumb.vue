<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item
      v-for="item in breadcrumbs"
      :key="item.path"
      :to="item.path"
    >
      {{ item.meta?.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  return route.matched.filter((item) => item.meta?.title)
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
