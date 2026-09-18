<template>
  <div v-if="tabsStore.tabList.length > 0" class="tab-bar">
    <!-- 侧栏折叠开关：工作区行最左端，与侧栏 logo 处于同一水平带 -->
    <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
      <Fold v-if="!appStore.sidebarCollapsed" />
      <Expand v-else />
    </el-icon>

    <el-scrollbar ref="tabScrollRef" class="tab-scroll">
      <div class="tab-list">
        <div
          v-for="(tab, index) in tabsStore.tabList"
          :key="tab.path"
          :ref="(el: any) => (tabItemRefs[index] = el)"
          class="tab-item"
          :class="{ active: tab.path === tabsStore.activeTab }"
          @click="handleClick(tab)"
          @contextmenu.prevent="openContextMenu($event, tab)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <el-icon v-if="!tab.affix" class="tab-close" @click.stop="handleClose(tab.path)">
            <Close />
          </el-icon>
        </div>
      </div>
    </el-scrollbar>
    <div class="tab-actions">
      <el-tooltip content="关闭其他" placement="bottom">
        <span class="action-btn" @click="handleCloseOthersCurrent">
          <el-icon>
            <SemiSelect />
          </el-icon>
        </span>
      </el-tooltip>
    </div>

    <!-- 用户信息：与工作区行同处一行（顶行），位置行（返回 + 面包屑）保持纯净。
         作为 tab-actions 的兄弟节点，由 tab-actions 的右边框与工作区分隔 -->
    <el-dropdown trigger="click" @command="handleCommand">
      <span class="user-info">
        <el-avatar :size="28" icon="UserFilled" />
        <span class="username">{{ userStore.username || '管理员' }}</span>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
          <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 右键菜单 -->
    <teleport to="body">
      <div
        v-show="contextMenuVisible"
        class="tab-context-menu"
        :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
      >
        <div class="menu-item" @click="handleRefresh">
          <el-icon>
            <Refresh />
          </el-icon>
          <span>重新加载</span>
        </div>
        <div
          class="menu-item"
          :class="{ disabled: contextMenuTab?.affix }"
          @click="handleClose(contextMenuTab?.path || '')"
        >
          <el-icon>
            <Close />
          </el-icon>
          <span>关闭当前</span>
        </div>
        <div class="menu-item" @click="handleCloseOthers">
          <el-icon>
            <SemiSelect />
          </el-icon>
          <span>关闭其他</span>
        </div>
        <div class="menu-item" @click="handleCloseLeft">
          <el-icon>
            <DArrowLeft />
          </el-icon>
          <span>关闭左侧</span>
        </div>
        <div class="menu-item" @click="handleCloseRight">
          <el-icon>
            <DArrowRight />
          </el-icon>
          <span>关闭右侧</span>
        </div>
        <div class="menu-item" @click="handleCloseAll">
          <el-icon>
            <CircleClose />
          </el-icon>
          <span>关闭所有</span>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Close,
  Refresh,
  SemiSelect,
  DArrowLeft,
  DArrowRight,
  CircleClose,
  ArrowDown,
  Expand,
  Fold,
} from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useAppStore } from '@/stores/modules/app'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore, type TabItem } from '@/stores/modules/tabs'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

/** 用户菜单：修改密码 / 退出登录 */
async function handleCommand(command: string) {
  if (command === 'changePassword') {
    // 弹窗改页面：跳转独立的修改密码任务页（改密成功后由该页登出并回到登录页）
    router.push('/system/admin/password')
    return
  }
  if (command !== 'logout') return
  permissionStore.resetPermission()
  try {
    await userStore.logout()
  } catch {
    // 后端异常不影响前端注销，本地状态已在 logout 内部清除
  }
  router.push('/login')
}

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuLeft = ref(0)
const contextMenuTop = ref(0)
const contextMenuTab = ref<TabItem | null>(null)

// 标签项引用
const tabItemRefs = ref<(globalThis.Element | null)[]>([])

// 滚动容器引用
const tabScrollRef = ref<globalThis.Element | null>(null)

/** 滚动到激活标签 */
function scrollToActiveTab() {
  const activeTab = tabsStore.activeTab
  if (!activeTab || tabItemRefs.value.length === 0) return

  const index = tabsStore.tabList.findIndex((tab) => tab.path === activeTab)
  if (index === -1) return

  const el = tabItemRefs.value[index]
  if (el && tabScrollRef.value) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }
}

/** 点击标签切换页面 */
function handleClick(tab: TabItem) {
  if (tab.path !== route.path) {
    router.push({ path: tab.path, query: tab.query })
  }
}

/** 监听激活标签变化，自动滚动到激活标签 */
watch(
  () => tabsStore.activeTab,
  () => {
    // 等待下一帧，确保 ref 绑定完成
    window.requestAnimationFrame(() => {
      scrollToActiveTab()
    })
  },
  { immediate: true },
)

/** 监听标签列表变化，重建 ref 数组 */
watch(
  () => tabsStore.tabList,
  () => {
    tabItemRefs.value = []
  },
  { deep: true },
)

/** 关闭标签 */
function handleClose(path: string) {
  if (!path) return
  const redirectPath = tabsStore.closeTab(path)
  if (redirectPath && redirectPath !== route.path) {
    router.push(redirectPath)
  }
}

/** 关闭其他标签（右键菜单） */
function handleCloseOthers() {
  if (!contextMenuTab.value) return
  tabsStore.closeOtherTabs(contextMenuTab.value.path)
  if (route.path !== contextMenuTab.value.path) {
    router.push(contextMenuTab.value.path)
  }
  closeContextMenu()
}

/** 关闭其他标签（操作按钮，基于当前激活标签） */
function handleCloseOthersCurrent() {
  tabsStore.closeOtherTabs(tabsStore.activeTab)
  if (route.path !== tabsStore.activeTab) {
    router.push(tabsStore.activeTab)
  }
}

/** 关闭左侧标签 */
function handleCloseLeft() {
  if (!contextMenuTab.value) return
  tabsStore.closeLeftTabs(contextMenuTab.value.path)
  if (route.path !== contextMenuTab.value.path) {
    router.push(contextMenuTab.value.path)
  }
  closeContextMenu()
}

/** 关闭右侧标签 */
function handleCloseRight() {
  if (!contextMenuTab.value) return
  tabsStore.closeRightTabs(contextMenuTab.value.path)
  if (route.path !== contextMenuTab.value.path) {
    router.push(contextMenuTab.value.path)
  }
  closeContextMenu()
}

/** 关闭所有标签 */
function handleCloseAll() {
  const redirectPath = tabsStore.closeAllTabs()
  if (redirectPath && route.path !== redirectPath) {
    router.push(redirectPath)
  }
  closeContextMenu()
}

/** 重新加载当前页面 */
function handleRefresh() {
  router.replace({
    path: '/redirect' + (contextMenuTab.value?.path || route.path),
  })
  closeContextMenu()
}

/** 打开右键菜单 */
function openContextMenu(e: { clientX: number; clientY: number }, tab: TabItem) {
  contextMenuTab.value = tab
  contextMenuLeft.value = e.clientX
  contextMenuTop.value = e.clientY
  contextMenuVisible.value = true
}

/** 关闭右键菜单 */
function closeContextMenu() {
  contextMenuVisible.value = false
  contextMenuTab.value = null
}

/** 点击其他区域关闭右键菜单 */
function handleClickOutside() {
  if (contextMenuVisible.value) {
    closeContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.tab-bar {
  display: flex;
  align-items: center;
  /* 与侧栏 logo 同高（48px），保证左侧分隔线不错位 */
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.collapse-btn {
  flex-shrink: 0;
  /* 与下方「返回 + 面包屑」行的左内边距对齐 */
  margin-left: 20px;
  margin-right: 4px;
  font-size: 20px;
  color: #535966;
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    color: #006bb4;
  }
}

.tab-scroll {
  flex: 1;
  height: 100%;

  :deep(.el-scrollbar__bar.is-horizontal) {
    display: none !important;
  }

  :deep(.el-scrollbar__bar.is-vertical) {
    display: none;
  }
}

.tab-list {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  white-space: nowrap;
  box-sizing: border-box;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  margin-right: 6px;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  flex-shrink: 0;

  &:hover {
    color: #006bb4;
    background: #e6f0f8;
  }

  &.active {
    color: #006bb4;
    background: #e6f0f8;
    font-weight: 500;

    .tab-close {
      opacity: 1;
    }
  }
}

.tab-title {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  margin-left: 6px;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;

  &:hover {
    background: rgba(0, 0, 0, 0.12);
    color: #f56c6c;
  }
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-actions {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  /* 右侧满高线：工作区 ｜ 账户 的强分隔 */
  border-right: 1px solid #e4e7ed;
  flex-shrink: 0;

  /* 左侧半线：标签区 ｜ 标签操作 的弱分隔，高度与「关闭其他」按钮对齐（28px） */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 28px;
    background: #e4e7ed;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s;

  .el-icon {
    font-size: 16px;
  }

  &:hover {
    background: #e6f0f8;
    color: #006bb4;
  }
}

.user-info {
  display: flex;
  align-items: center;
  /* 不用分隔线：靠组间距 + 自身 hover 反馈区分「工作区」与「账户」，视觉更轻 */
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #535966;
  transition: background-color 0.2s;

  &:hover {
    background: #e6f0f8;
    color: #006bb4;
  }

  .username {
    margin: 0 8px;
    font-size: 14px;
  }
}

.tab-context-menu {
  position: fixed;
  z-index: 3000;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 140px;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 6px 16px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    transition: all 0.15s;

    .el-icon {
      margin-right: 8px;
      font-size: 14px;
    }

    &:hover {
      background: #f5f7fa;
      color: #006bb4;
    }

    &.disabled {
      color: #c0c4cc;
      cursor: not-allowed;

      &:hover {
        background: transparent;
        color: #c0c4cc;
      }
    }
  }
}
</style>
