<template>
  <el-aside class="sidebar" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <div class="logo">
      <h1 v-show="!appStore.sidebarCollapsed">商城后台</h1>
      <h1 v-show="appStore.sidebarCollapsed">M</h1>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="route.path"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="#ffffff"
        text-color="#535966"
        active-text-color="#006bb4"
        router
      >
        <template v-for="item in menuList" :key="item.path">
          <!-- 有子菜单 -->
          <el-sub-menu v-if="item.children?.length" :index="item.path">
            <template #title>
              <el-icon><component :is="item.meta?.icon" /></el-icon>
              <span>{{ item.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="`${item.path}/${child.path}`"
            >
              <el-icon><component :is="child.meta?.icon" /></el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <!-- 无子菜单（如仪表盘） -->
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.meta?.icon" /></el-icon>
            <template #title><span>{{ item.meta?.title }}</span></template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { usePermissionStore } from '@/stores/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const menuList = computed(() => permissionStore.menuList)
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1001;
  width: var(--sidebar-width, 210px);
  background-color: #ffffff;
  border-right: 1px solid #d3dae6;
  transition: width 0.3s ease;
  overflow: hidden;

  &.sidebar-collapsed {
    width: var(--sidebar-collapsed-width, 64px);
  }
}

.logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-bottom: 1px solid #d3dae6;

  h1 {
    color: #1a1c21;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    white-space: nowrap;
  }
}

:deep(.el-scrollbar) {
  background-color: #ffffff;
}

:deep(.el-menu) {
  border-right: none;
  background-color: #ffffff;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  margin: 2px 8px;
  border-radius: 8px;
  color: #535966 !important;

  &:hover {
    background-color: #f5f7fa !important;
    color: #1a1c21 !important;
  }
}

:deep(.el-menu-item.is-active) {
  background-color: #e6f0f8 !important;
  color: #006bb4 !important;
  font-weight: 500;
}

:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: #006bb4 !important;
}
</style>
