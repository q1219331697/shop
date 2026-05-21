/**
 * 应用状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  /** 侧边栏是否折叠 */
  const sidebarCollapsed = ref(false)
  /** 设备类型 */
  const device = ref<'desktop' | 'mobile'>('desktop')

  /** 切换侧边栏折叠 */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  /** 设置设备类型 */
  function setDevice(val: 'desktop' | 'mobile') {
    device.value = val
  }

  return {
    sidebarCollapsed,
    device,
    toggleSidebar,
    setDevice,
  }
})
