<template>
  <el-container class="admin-layout" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <Sidebar />
    <el-container class="main-container">
      <Navbar />
      <TabBar />
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/modules/app'

import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import TabBar from './components/TabBar.vue'

const appStore = useAppStore()
</script>

<style lang="scss">
.admin-layout {
  --sidebar-width: 220px;
  --sidebar-collapsed-width: 64px;

  &.sidebar-collapsed {
    --sidebar-width: var(--sidebar-collapsed-width);
  }
}
</style>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex-direction: column;
  margin-left: var(--sidebar-width);
  width: 100%;
  transition: margin-left 0.3s ease;
  overflow: hidden;
}

.app-main {
  flex: 1;
  /* 竖向留白：页面上下各 8px（搜索区上方、分页下方），兼顾紧凑与呼吸感 */
  padding: 8px 16px;
  background: #ffffff;
  overflow-y: auto;
}

:deep(.el-header) {
  margin: 0 !important;
}
</style>
