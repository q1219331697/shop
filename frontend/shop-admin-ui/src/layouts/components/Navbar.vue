<template>
  <el-header class="navbar">
    <div class="navbar-left">
      <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <!-- 子页面（新增/编辑/详情/分配）返回入口：置于页面左上角、面包屑前。
           用带文字的按钮而非裸图标，保证「有明确的返回途径」 -->
      <el-button v-if="isSubPage" class="back-btn" text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <Breadcrumb />
    </div>
    <div class="navbar-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="30" icon="UserFilled" />
          <span class="username">{{ userStore.username || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { Fold, Expand, ArrowDown, ArrowLeft } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAppStore } from '@/stores/modules/app'
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'

import Breadcrumb from './Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

/** 是否为「列表页 → 子页面」形态（子页面通过 meta.activeMenu 归位到所属列表页） */
const isSubPage = computed(() => !!route.meta.activeMenu)

/** 返回上一页；直接输入地址进入（无历史）时回退到所属列表页 */
function goBack() {
  const canGoBack = !!router.options.history.state.back
  const activeMenu = route.meta.activeMenu as string | undefined
  if (canGoBack) {
    router.back()
  } else if (activeMenu) {
    router.push(activeMenu)
  }
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    permissionStore.resetPermission()
    try {
      await userStore.logout()
    } catch {
      // 后端异常不影响前端注销，本地状态已在 finally 中清除
    }
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  --navbar-h-padding: 20px;
  height: 48px !important;
  padding: 0 var(--navbar-h-padding) !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #d3dae6;
  margin: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
  color: #535966;

  &:hover {
    color: #006bb4;
  }
}

.navbar-right {
  display: flex;
  align-items: center;
}

.back-btn {
  margin-right: 12px;
  padding: 0 10px;
  height: 28px;
  font-size: 14px;
  color: #535966;

  &:hover {
    color: #006bb4;
    background-color: #f5f7fa;
  }

  .el-icon {
    margin-right: 4px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-right: 0;
  color: #535966;

  &:hover {
    color: #006bb4;
  }

  .username {
    margin: 0 8px;
    font-size: 14px;
  }
}
</style>
