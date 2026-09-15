/**
 * usePageNav - 页面导航元数据统一出口
 *
 * 「我在哪 / 我能去哪」全站只认这一份数据，避免顶栏、面包屑、侧栏各算一套：
 * - pageTitle    当前页标题（与面包屑末级一致，任务页据此渲染页面标题）
 * - listPath     任务页归属的列表页路径（路由 meta.activeMenu）
 * - isTaskPage   是否为列表页派生的任务页（新增/编辑/详情/分配）
 * - breadcrumbs  模块 → 列表页 → 当前页 的层级链
 * - goBackToList 任务页返回来源列表页（全站唯一的返回实现）
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function usePageNav() {
  const route = useRoute()
  const router = useRouter()

  /** 当前页标题（来自路由 meta.title） */
  const pageTitle = computed(() => (route.meta.title as string) || '')

  /** 任务页归属的列表页路径 */
  const listPath = computed(() => (route.meta.activeMenu as string) || '')

  /** 是否为任务页（列表页派生的新增/编辑/详情/分配） */
  const isTaskPage = computed(() => !!listPath.value)

  /**
   * 面包屑层级链。
   *
   * 任务页（新增/编辑/详情/分配）不在菜单树里，route.matched 只有自身一条，
   * 直接用会丢掉「系统管理 / 管理员管理」前缀；故用 meta.activeMenu 解析出
   * 所属列表页的匹配链补在前面，保证列表页与任务页的面包屑层级一致。
   */
  const breadcrumbs = computed(() => {
    const current = route.matched.filter((item) => item.meta?.title)
    if (!listPath.value) return current

    const parent = router
      .resolve(listPath.value)
      .matched.filter((item) => item.meta?.title && item.name !== 'NotFound')
    return parent.length > 0 ? [...parent, ...current] : current
  })

  /**
   * 返回来源列表页（全站唯一的返回行为）。
   *
   * - 上一页就是来源列表页：走 history.back()，保留浏览器历史与列表位置
   * - 否则（直接输 URL 打开、从其他入口跳入）：跳转来源列表页，
   *   此时若用 back() 会退到站外/登录页，用户会「回不到列表」
   */
  function goBackToList() {
    const target = listPath.value
    const previous = router.options.history.state.back

    if (target && typeof previous === 'string' && previous.startsWith(target)) {
      router.back()
      return
    }
    if (target) {
      router.push(target)
      return
    }
    router.back()
  }

  return { pageTitle, listPath, isTaskPage, breadcrumbs, goBackToList }
}
