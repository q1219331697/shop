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
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
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
  padding: 24px;
  background: #ffffff;
  overflow-y: auto;
}

:deep(.el-header) {
  margin: 0 !important;
}
</style>
