/**
 * 表格可用高度（作为 el-table 的 max-height）
 *
 * 统一约定（所有列表页共用，不要在页面里各写一套）：
 * - 表格按「内容高度」渲染：行少时表格与分页之间不留空白，分页紧跟表格；
 * - 内容超出可用高度时才在表格内部滚动（表头固定），避免长列表把页面撑得很长。
 *
 * 可用高度 = 数据区容器高度 − 分页区高度（含其上外边距）。
 *
 * 用法：
 * ```ts
 * const dataRef = ref<HTMLElement | null>(null)
 * const paginationRef = ref<HTMLElement | null>(null)
 * const maxHeight = useTableMaxHeight(dataRef, paginationRef)
 * ```
 * 模板：`<el-table :max-height="maxHeight" />`
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useTableMaxHeight(
  /** 数据区容器（其 clientHeight 为可用高度上限） */
  containerRef: Ref<HTMLElement | null | undefined>,
  /** 分页区元素（可选；其高度与上外边距会从可用高度中扣除） */
  paginationRef?: Ref<HTMLElement | null | undefined>,
) {
  const availableHeight = ref(0)

  function update() {
    const container = containerRef.value
    if (!container) return
    const pagination = paginationRef?.value
    const paginationHeight = pagination
      ? pagination.offsetHeight + (parseFloat(getComputedStyle(pagination).marginTop) || 0)
      : 0
    availableHeight.value = Math.max(0, container.clientHeight - paginationHeight)
  }

  let observer: ResizeObserver | null = null

  function observe() {
    observer?.disconnect()
    observer = null
    const container = containerRef.value
    if (container && typeof ResizeObserver !== 'undefined') {
      // 窗口缩放 / 侧边栏折叠等导致容器尺寸变化时重算
      observer = new ResizeObserver(() => update())
      observer.observe(container)
    }
  }

  function refresh() {
    void nextTick(() => {
      update()
      observe()
    })
  }

  onMounted(refresh)

  // 容器或分页元素替换（含分页显隐）时重新计算并观察
  watch([containerRef, () => paginationRef?.value], refresh)

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    /** 传给 el-table 的 max-height（未测量到时为 undefined，此时表格按内容高度渲染） */
    maxHeight: computed(() => (availableHeight.value > 0 ? availableHeight.value : undefined)),
    /** 手动触发重算（如分页显隐变化后） */
    refresh,
  }
}
